import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { ARC_NETWORK, ARC_NETWORK_DISPLAY, ARC_PREDICTABLE_GAS_USD } from '../utils/arcConfig';
import { treasuryAbi } from '../abi/treasuryAbi';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface ArcContextValue {
  account: string | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  contract: ethers.Contract | null;
  isConnecting: boolean;
  arcGasPriceUsd: number;
  networkName: string;
  connectWallet: () => Promise<void>;
}

const ArcContext = createContext<ArcContextValue | undefined>(undefined);

interface Props {
  children: React.ReactNode;
}

const TREASURY_ADDRESS = import.meta.env.VITE_TREASURY_ADDRESS || '';

export const ArcProvider: React.FC<Props> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const ensureArcNetwork = useCallback(async () => {
    if (!window.ethereum) return;

    const chainIdHex = ARC_NETWORK.chainId;
    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

    if (currentChainId !== chainIdHex) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [ARC_NETWORK]
      });
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert('Arc dashboard requires an Arc-compatible wallet such as MetaMask.');
      return;
    }

    try {
      setIsConnecting(true);
      await ensureArcNetwork();

      const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts.length) throw new Error('No Arc accounts returned by wallet');

      const web3Provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
      const signerInstance = web3Provider.getSigner();

      setProvider(web3Provider);
      setSigner(signerInstance);
      setAccount(ethers.utils.getAddress(accounts[0]));
    } finally {
      setIsConnecting(false);
    }
  }, [ensureArcNetwork]);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts.length) {
        setAccount(null);
        setSigner(null);
        setContract(null);
        return;
      }
      setAccount(ethers.utils.getAddress(accounts[0]));
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  useEffect(() => {
    if (!signer || !TREASURY_ADDRESS) {
      setContract(null);
      return;
    }

    const treasuryContract = new ethers.Contract(TREASURY_ADDRESS, treasuryAbi, signer);
    setContract(treasuryContract);
  }, [signer]);

  const value = useMemo<ArcContextValue>(() => {
    return {
      account,
      provider,
      signer,
      contract,
      isConnecting,
      connectWallet,
      arcGasPriceUsd: ARC_PREDICTABLE_GAS_USD,
      networkName: ARC_NETWORK_DISPLAY
    };
  }, [account, provider, signer, contract, isConnecting, connectWallet]);

  return <ArcContext.Provider value={value}>{children}</ArcContext.Provider>;
};

export const useArcProvider = () => {
  const context = useContext(ArcContext);
  if (!context) {
    throw new Error('useArcProvider must be used within an ArcProvider');
  }
  return context;
};

