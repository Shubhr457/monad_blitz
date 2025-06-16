import { useContractRead, useContractWrite, useAccount, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { CHAINLUCK_CONTRACT_ADDRESS } from '../config/wagmi'
import { CHAINLUCK_ABI } from '../config/contract'

export function useChainLuck() {
  const { address } = useAccount()

  // Read Functions
  const { data: roundInfo, isLoading: roundInfoLoading, refetch: refetchRoundInfo } = useContractRead({
    address: CHAINLUCK_CONTRACT_ADDRESS,
    abi: CHAINLUCK_ABI,
    functionName: 'getCurrentRoundInfo',
  })

  const { data: vaultBalance, isLoading: vaultBalanceLoading, refetch: refetchVaultBalance } = useContractRead({
    address: CHAINLUCK_CONTRACT_ADDRESS,
    abi: CHAINLUCK_ABI,
    functionName: 'vaultBalance',
  })

  const { data: hasEntered, isLoading: hasEnteredLoading, refetch: refetchHasEntered } = useContractRead({
    address: CHAINLUCK_CONTRACT_ADDRESS,
    abi: CHAINLUCK_ABI,
    functionName: 'hasUserEnteredCurrent',
    args: address ? [address] : undefined,
    enabled: !!address,
  })

  const { data: isOwner, isLoading: isOwnerLoading } = useContractRead({
    address: CHAINLUCK_CONTRACT_ADDRESS,
    abi: CHAINLUCK_ABI,
    functionName: 'owner',
    select: (data) => data === address,
  })

  const { data: winnersPerDraw } = useContractRead({
    address: CHAINLUCK_CONTRACT_ADDRESS,
    abi: CHAINLUCK_ABI,
    functionName: 'winnersPerDraw',
  })

  const { data: minParticipants } = useContractRead({
    address: CHAINLUCK_CONTRACT_ADDRESS,
    abi: CHAINLUCK_ABI,
    functionName: 'minParticipants',
  })

  // Write Functions
  const { 
    data: enterHash, 
    writeContract: enterLottery, 
    isPending: enterPending 
  } = useContractWrite()

  const { 
    data: depositHash, 
    writeContract: depositToVault, 
    isPending: depositPending 
  } = useContractWrite()

  const { 
    data: drawHash, 
    writeContract: drawWinners, 
    isPending: drawPending 
  } = useContractWrite()

  // Transaction receipts
  const { isLoading: enterConfirming, isSuccess: enterSuccess } = useWaitForTransactionReceipt({
    hash: enterHash,
  })

  const { isLoading: depositConfirming, isSuccess: depositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  })

  const { isLoading: drawConfirming, isSuccess: drawSuccess } = useWaitForTransactionReceipt({
    hash: drawHash,
  })

  // Helper functions
  const enter = async () => {
    if (!address) return
    
    enterLottery({
      address: CHAINLUCK_CONTRACT_ADDRESS,
      abi: CHAINLUCK_ABI,
      functionName: 'enter',
      args: [address],
    })
  }

  const deposit = async (amount: string) => {
    depositToVault({
      address: CHAINLUCK_CONTRACT_ADDRESS,
      abi: CHAINLUCK_ABI,
      functionName: 'deposit',
      value: parseEther(amount),
    })
  }

  const draw = async () => {
    drawWinners({
      address: CHAINLUCK_CONTRACT_ADDRESS,
      abi: CHAINLUCK_ABI,
      functionName: 'drawWinners',
    })
  }

  const refetchAll = () => {
    refetchRoundInfo()
    refetchVaultBalance()
    refetchHasEntered()
  }

  // Parsed data
  const parsedRoundInfo = roundInfo ? {
    roundId: Number(roundInfo[0]),
    participantCount: Number(roundInfo[1]),
    vaultBalance: formatEther(roundInfo[2]),
    isActive: roundInfo[3],
  } : null

  const parsedVaultBalance = vaultBalance ? formatEther(vaultBalance) : '0'

  return {
    // State
    roundInfo: parsedRoundInfo,
    vaultBalance: parsedVaultBalance,
    hasEntered: hasEntered || false,
    isOwner: isOwner || false,
    winnersPerDraw: winnersPerDraw ? Number(winnersPerDraw) : 0,
    minParticipants: minParticipants ? Number(minParticipants) : 0,
    
    // Loading states
    isLoading: roundInfoLoading || vaultBalanceLoading || hasEnteredLoading,
    isOwnerLoading,
    
    // Actions
    enter,
    deposit,
    draw,
    refetchAll,
    
    // Transaction states
    enterPending: enterPending || enterConfirming,
    enterSuccess,
    depositPending: depositPending || depositConfirming,
    depositSuccess,
    drawPending: drawPending || drawConfirming,
    drawSuccess,
  }
} 