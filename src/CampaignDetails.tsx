import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import contractAbi from './utils/abi.json';
import CopyableString from './nillion/components/CopyableString';
import RetrieveSecret from './nillion/components/RetrieveSecretForm';
import { NillionClient } from '@nillion/client-web';
import { networks } from './utils/networks';
import ConnectionSection from './nillion/components/FetchDataClient';
import { Button } from '@mui/material';

const CONTRACT_ADDRESS = '0x24f9150e77637673Eeb09D4Df456f9d2a82aDC7d'; //0x24f9150e77637673Eeb09D4Df456f9d2a82aDC7d

const CampaignDetails = () => {
  const { owner, name, id } = useParams<{ owner: string; name: string; id: string }>();
  const [entries, setEntries] = useState<{ storeId: string; dataName: string; submitter: string; paid: boolean; entryId: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<NillionClient>(null!);
  const [userkey, setUserKey] = useState<string | null>(null);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);

  // Helper function to check if the user is the creator of the campaign
  const isCreator = (wallet: string | null, owner: string) =>
    wallet?.toLowerCase() === owner.toLowerCase();

  // Handle payment logic
  const handlePay = async (entryId: number) => {
    try {
      const { ethereum } = window;
      if (!ethereum) throw new Error('MetaMask is not installed');
      
      await ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
      
      console.log(`Attempting to release payment for entryId: ${entryId}`);
      const newEntryId = entryId +1;
      const tx = await contract.releasePayment(id, newEntryId, {
        gasLimit: ethers.utils.hexlify(1000000),
      });
      console.log(`Transaction hash: ${tx.hash}`);
      await tx.wait();

      setEntries((prevEntries) =>
        prevEntries.map((entry) =>
          entry.entryId === entryId ? { ...entry, paid: true } : entry
        )
      );

      alert('Payment released successfully!');
    } catch (error) {
      console.error('Error releasing payment:', error);
      alert('Error releasing payment');
    }
  };

  // Check if MetaMask is connected
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log('Make sure you have MetaMask!');
      return;
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
      setConnectedWallet(accounts[0]);
    }

    const chainId = await ethereum.request({ method: 'eth_chainId' });
    const networkName = networks[chainId] || 'Unknown Network';

    ethereum.on('chainChanged', () => {
      window.location.reload();
    });
  };

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const { ethereum } = window;
        if (!ethereum) throw new Error('MetaMask is not installed');

        const provider = new ethers.providers.Web3Provider(ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, provider);

        const accounts = await ethereum.request({ method: 'eth_accounts' });
        const account = accounts[0];
        setConnectedWallet(account);

        const campaignEntries = await contract.getEntries(id);
        // Map entries with unique entryId
        setEntries(campaignEntries.map((entry: any, index: number) => ({
          ...entry,
          entryId: index
        })));
      } catch (error) {
        console.error('Error fetching entries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [id]);

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="flex p-6">
      <div className="w-3/5 mr-10">
        <h2 className="text-6xl mb-6">{name} Campaign Entries</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {entries.map((entry) => (
            <li key={entry.entryId} className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex">
                <p className="text-ba font-bold">Store ID: </p>
                <p>
                  <CopyableString
                    text={entry.storeId}
                    copyText={entry.storeId}
                    shouldTruncate={true}
                    truncateLength={10}
                    descriptor="Store ID"
                  />
                </p>
              </div>
              <div className="flex">
                <p className="text-ba font-bold">Data Name: </p>
                <p>
                  <CopyableString
                    text={entry.dataName}
                    copyText={entry.dataName}
                    shouldTruncate={true}
                    truncateLength={10}
                    descriptor="Data Name"
                  />
                </p>
              </div>
              <div className="flex">
                <p className="text-ba font-bold">Submitter: </p>
                <p>
                  <CopyableString
                    text={entry.submitter}
                    copyText={entry.submitter}
                    shouldTruncate={true}
                    truncateLength={10}
                    descriptor="Submitter"
                  />
                </p>
              </div>
              <div className="flex">
                <p className="text-ba font-bold">Paid: </p>
                <p>{entry.paid ? 'Yes' : 'No'}</p>
              </div>
              {/* Conditionally render the "Pay" button */}
              {isCreator(connectedWallet ?? '', owner) && !entry.paid && (
                <Button
                  onClick={() => handlePay(entry.entryId)}
                  variant="contained"
                  color="primary"
                >
                  Pay
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="w-2/5">
        <p className="text-5xl font-bold">Retrieve Data From Entries</p>
        <ConnectionSection
          client={client}
          userkey={userkey}
          setUserKey={setUserKey}
          setClient={setClient}
        />
        <RetrieveSecret nillionClient={client} />
      </div>
    </div>
  );
};

export default CampaignDetails;
