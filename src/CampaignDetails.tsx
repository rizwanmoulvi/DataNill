import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import contractAbi from './utils/abi.json';
import CopyableString from './nillion/components/CopyableString';
import RetrieveSecret from './nillion/components/RetrieveSecretForm';
import { NillionClient } from '@nillion/client-web';
import {
  readStorageForUserAtPage,
  updateStorageForUserAtPage,
} from './nillion/helpers/localStorage';

import ConnectionSection from './nillion/components/FetchDataClient';
import { Button } from '@mui/material';

const CONTRACT_ADDRESS = '0x2C409aDe7ae8949f990Af584181851780C9182DD';

const CampaignDetails = () => {
  const { id } = useParams();
  const [entries, setEntries] = useState<{ storeId: string; dataName: string; UID: string; submitter: string; paid: boolean; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<NillionClient>(null!);
  const [userkey, setUserKey] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [partyId, setPartyId] = useState<string | null>(null);
  const [storedSecretInfo, setStoredSecretInfo] = useState<any>({});
  const [localStorageStoredSecrets, setLocalStorageStoredSecrets] =
    useState<any>({});
  const localStoragePageName = 'main-flow';
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    if (userkey && client) {
      setUserId(client.user_id);
      setPartyId(client.party_id);

      const storedItems = readStorageForUserAtPage(
        client.user_id,
        localStoragePageName
      );
      if (storedItems && Object.keys(storedItems).length > 0) {
        setLocalStorageStoredSecrets(storedItems);
        setStoredSecretInfo(storedItems);
      }
    }
  }, [userkey, client]);

  // Pay the submitter for the specific entry
  const handlePay = async (entryId: number) => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        throw new Error('MetaMask is not installed');
      }

      await ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);

      // Call the releasePayment function on the contract
      const tx = await contract.releasePayment(id, entryId, {
        gasLimit: ethers.utils.hexlify(1000000), // Set gas limit to 1,000,000
      });
      console.log(`Transaction hash: ${tx.hash}`);
      await tx.wait();


      // Update the entry's status to paid
      setEntries((prevEntries) =>
        prevEntries.map((entry, index) =>
          index === entryId ? { ...entry, paid: true } : entry
        )
      );

      alert('Payment released successfully!');
    } catch (error) {
      console.error('Error releasing payment:', error);
      alert('Error releasing payment');
    }
  };

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const { ethereum } = window;

        if (!ethereum) {
          throw new Error('MetaMask is not installed');
        }

        const provider = new ethers.providers.Web3Provider(ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, provider);

        const campaignEntries = await contract.getEntries(id);
        setEntries(campaignEntries);
      } catch (error) {
        console.error('Error fetching entries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [id]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="flex p-6">
      <div className='w-3/5 mr-10'>
        <h2 className="text-6xl mb-6">Campaign Entries</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {entries.map((entry, index) => (
            <li key={index} className='bg-white p-4 rounded-lg shadow-md'>
              <div className='flex'>
                <p className='text-ba font-bold'>Store ID: </p>
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
              <div className='flex'>
                <p className='text-ba font-bold'>Data Name: </p>
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
              <div className='flex'>
                <p className='text-ba font-bold'>Submitter: </p>
                <p><CopyableString
                  text={entry.submitter}
                  copyText={entry.submitter}
                  shouldTruncate={true}
                  truncateLength={10}
                  descriptor="Submitter"
                /></p>
              </div>
              <div className='flex'>
                <p className='text-ba font-bold'>Paid: </p><p>{entry.paid ? 'Yes' : 'No'}</p>
              </div>
              <Button
                onClick={() => handlePay(index)}
                variant="contained"
                color="primary"
                disabled={entry.paid}
              >
                Pay
              </Button>
            </li>
          ))}
        </ul>
      </div>
      <div className='w-2/5'>
        <p className='text-5xl font-bold'>Retrieve Data From Entries</p>
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
