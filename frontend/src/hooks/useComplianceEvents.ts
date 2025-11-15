import { useEffect } from 'react';
import { useContractEvent } from 'wagmi';
import { TREASURY_ABI, TREASURY_CONTRACT_ADDRESS } from '../constants/treasury';

/**
 * Subscribes to AllocationReportData events emitted by the Treasury contract
 * and logs the pertinent details for external reporting.
 */
export function useComplianceEvents() {
  const logEvent = (recipient: string, amount: bigint, ruleId: bigint) => {
    const formatted = {
      recipient,
      amount: amount.toString(),
      ruleId: ruleId.toString()
    };
    console.info('[AllocationReportData]', formatted);
  };

  useContractEvent({
    address: TREASURY_CONTRACT_ADDRESS,
    abi: TREASURY_ABI,
    eventName: 'AllocationReportData',
    listener: (recipient, amount, ruleId) => {
      logEvent(recipient, amount, ruleId);
    }
  });

  useEffect(() => {
    // Hook can be extended with cleanup logic if needed
  }, []);
}

