.PHONY: install build test clean deploy

install:
	forge install OpenZeppelin/openzeppelin-contracts

build:
	forge build

test:
	forge test

test-verbose:
	forge test -vvv

clean:
	forge clean

deploy:
	forge script scripts/Deploy.s.sol:DeployTreasury --rpc-url $$RPC_URL --broadcast --verify

lint:
	forge fmt

