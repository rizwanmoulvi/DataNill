import React, { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import { ethers } from 'ethers';
import contractAbi from './utils/abi.json';
import { networks } from './utils/networks';

const CONTRACT_ADDRESS = '0x2C409aDe7ae8949f990Af584181851780C9182DD';

const CampaignForm: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [UID, setUID] = useState<string>('');
  const [budget, setBudget] = useState<number | string>('');
  const [numTasks, setNumTasks] = useState<number | string>('');
  const [payPerTask, setPayPerTask] = useState<number | string>('');
  const [active, setActive] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentAccount, setCurrentAccount] = useState<string>('');
  const [network, setNetwork] = useState<string>('');

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log('Make sure you have MetaMask!');
      return;
    } else {
      console.log('We have the ethereum object', ethereum);
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log('Found an authorized account:', account);
      setCurrentAccount(account);
    } else {
      console.log('No authorized account found');
    }

    const chainId = await ethereum.request({ method: 'eth_chainId' });
    const networkName = networks[chainId] || 'Unknown Network';
    setNetwork(networkName);

    ethereum.on('chainChanged', () => {
      window.location.reload();
    });
  };

  const createCampaign = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validate input values
    if (!name || !UID || !budget || !numTasks || !payPerTask) {
      setErrorMessage('Please fill in all fields');
      return;
    }
  
    // Convert budget to wei
    const budgetInWei = ethers.utils.parseEther(budget.toString());
  
    setLoading(true);
    setErrorMessage('');
    console.log("Creating campaign with details:", {
      name,
      UID,
      budget: budgetInWei,
      numTasks,
      payPerTask,
      active
    });
  
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
  
        console.log('Budget before conversion:', budget);
        console.log('PayPerTask before conversion:', payPerTask);
        console.log("Going to pop wallet now to pay gas...");

        const budgetInWei = ethers.utils.parseEther(budget.toString());
        const payPerTaskInWei = ethers.utils.parseEther(payPerTask.toString());

        console.log('Budget in Wei:', budgetInWei.toString());
        console.log('PayPerTask in Wei:', payPerTaskInWei.toString());
  
        // Call the createCampaign function
        const tx = await contract.createCampaign(
          name,
          UID,
          budgetInWei,
          numTasks,
          payPerTaskInWei,
          active,
          {
            value: budgetInWei // Send the budget as value to the contract
          }
        );
  
        // Wait for transaction confirmation
        const receipt = await tx.wait();
  
        if (receipt.status === 1) {
          console.log(
            "Campaign created! https://opencampus-codex.blockscout.com/tx/" +
              tx.hash
          );
          // Reset form fields
          setName('');
          setUID('');
          setBudget('');
          setNumTasks('');
          setPayPerTask('');
          setActive(true);
        } else {
          setErrorMessage("Transaction failed! Please try again.");
        }
      } else {
        setErrorMessage('Ethereum object not found. Please install MetaMask.');
      }
    } catch (error) {
      console.log(error);
      setErrorMessage("Creation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <div>
      {loading && <p>Loading...</p>}
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <form onSubmit={createCampaign}>
        <label>
          Campaign Name:<br />
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </label><br />
        <label>
          Campaign ID:<br />
          <input type="text" value={UID} onChange={(e) => setUID(e.target.value)} required />
        </label><br />
        <label>
          Budget (ETH):<br />
          <input type="number" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} required />
        </label><br />
        <label>
          Number of Tasks:<br />
          <input type="number" value={numTasks} onChange={(e) => setNumTasks(e.target.value)} required />
        </label><br />
        <label>
          Pay/Task:<br />
          <input type="number" step="0.01" value={payPerTask} onChange={(e) => setPayPerTask(e.target.value)} required />
        </label><br />
        <label>
          Active:
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        </label><br />
        <Button type="submit" variant="contained" color="primary" disabled={loading}>
          Create Campaign
        </Button>
      </form>
    </div>
  );
};

export default CampaignForm;
