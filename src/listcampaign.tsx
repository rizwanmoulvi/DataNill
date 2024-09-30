import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import web3 from './web3';
import Button from '@mui/material/Button';
import CopyableString from './nillion/components/CopyableString';

import contractAbi from './utils/abi.json';
import { networks } from './utils/networks';
const ethers = require('ethers');

// Add null check for web3
if (!web3) {
  throw new Error('web3 is null');
}

interface Campaign {
  id: number;
  name: string;
  UID: string;
  budget: string;
  numTasks: number;
  payPerTask: string;
  active: boolean;
  remainingBudget: string;
  entryCount: number;
  owner: string;
}

const ListCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]); 
  const [showPopup, setShowPopup] = useState(false);
  const [storeId, setStoreId] = useState('');
  const [dataName, setDataName] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  

  //-------------------------------------------------------------

  const [currentAccount, setCurrentAccount] = useState<string>('');
  const [network, setNetwork] = useState('');
  

  const CONTRACT_ADDRESS = '0x06972fac237240a2BF0F28129a6fb7c3418A347A'; //0x06972fac237240a2BF0F28129a6fb7c3418A347A

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

  
  const fetchCampaigns = async () => {
    try {
      const { ethereum } = window;
  
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        console.log('Signer:', signer);
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi.abi,
          signer
        );
  
        // Fetch the total number of campaigns
        const campaignCount = await contract.campaignCount();
        
        // Loop through and fetch details of each campaign
        const deployedCampaigns = [];
        for (let i = 1; i <= campaignCount; i++) {
          const campaignDetails = await contract.getCampaignDetails(i);
  
          const campaign = {
            id: i,
            name: campaignDetails[0],
            description: campaignDetails[1],
            UID: campaignDetails[2],
            budget: campaignDetails[3].toString(),
            numTasks: campaignDetails[4].toString(),
            payPerTask: campaignDetails[5].toString(),
            active: campaignDetails[6],
            remainingBudget: campaignDetails[7].toString(),
            entryCount: campaignDetails[8].toString(),
            owner: campaignDetails[9].toString(),
          };
  
          deployedCampaigns.push(campaign);
        }
  
        console.log('Campaigns Fetched', deployedCampaigns);
        setCampaigns(deployedCampaigns);
      }
    } catch (error) {
      console.log(error);
    }
  };
  

  useEffect(() => {
    checkIfWalletIsConnected();
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (currentAccount) {
      fetchCampaigns();
    }
  }, [currentAccount, network]);

  //-------------------------------------------------------------


  const campaignsToDisplay = campaigns;

  const handleSubmitEntry = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowPopup(true);
  };

  const handlePopupSubmit = async () => {
    if (!selectedCampaign) return;

    setLoading(true); 

    try {
      const { ethereum } = window;

      if (!ethereum) {
        throw new Error('MetaMask is not installed');
      }

      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);

      const tx = await contract.submitData(
        selectedCampaign.id,
        storeId,
        dataName,
        selectedCampaign.UID
      );

      await tx.wait(); // Wait for the transaction to be confirmed

      console.log('Data submitted successfully');
      setShowPopup(false);
      setStoreId(''); 
      setDataName('');
    } catch (error) {
      console.error('Error submitting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignClick = (campaign: Campaign) => {
    navigate(`/campaign/${campaign.owner}/${campaign.name}/${campaign.id}`);
  };

  return (
    <div className=" p-6">
      <h2 className='text-6xl mb-6'>Active Campaigns</h2>

      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {campaignsToDisplay.map((campaign) => (
          <li key={campaign.id} className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-2">{campaign.name}</h3>
            <p>Description: {campaign.description}</p>
            <p>Campaign ID: <CopyableString
              text={campaign.UID}
              copyText={campaign.UID}
              shouldTruncate={true}
              truncateLength={10}
              descriptor="Campaign ID"
            /></p>    
            <p>Budget: {campaign.budget / 1000000000000000000} ETH</p>
            <p>Number of Tasks: {campaign.numTasks}</p>
            <p>Pay Per Task: {campaign.payPerTask / 1000000000000000000} ETH</p>
            <p>Active: {campaign.active ? 'Yes' : 'No'}</p>
            <p>Remaining Budget: {campaign.remainingBudget / 1000000000000000000} ETH</p>
            <p>Entries Submitted: {campaign.entryCount}</p>
            <div>
              <Button
                onClick={() => handleSubmitEntry(campaign)}
                variant="contained"
                color="primary"
                sx={{ marginRight: 2 }} // Add margin to the right
              >
                 Submit Entry
              </Button>
              <Button
                onClick={() => handleCampaignClick(campaign)}
                variant="contained"
                color="primary"
              >
                View Entries
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4">Submit Entry for {selectedCampaign?.name}</h3>
            <label className="block mb-2">
              Store ID:
              <input
                type="text"
                className="border p-2 w-full"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
              />
            </label>
            <label className="block mb-4">
              Data Name:
              <input
                type="text"
                className="border p-2 w-full"
                value={dataName}
                onChange={(e) => setDataName(e.target.value)}
              />
            </label>
            <button
              className="bg-blue-500 text-white p-2 rounded"
              onClick={handlePopupSubmit}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
            <button
              className="bg-red-500 text-white p-2 rounded ml-2"
              onClick={() => setShowPopup(false)}
              disabled={loading} 
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListCampaigns;