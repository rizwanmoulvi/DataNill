import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { networks } from './utils/networks';
import contractAbi from './utils/abi.json';

const ethers = require('ethers');

const Navbar: React.FC = () => {
  const [currentAccount, setCurrentAccount] = useState<string>('');
  const [network, setNetwork] = useState('');
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const CONTRACT_ADDRESS = '0x06972fac237240a2BF0F28129a6fb7c3418A347A'; //0x06972fac237240a2BF0F28129a6fb7c3418A347A

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert('Get MetaMask -> https://metamask.io/');
        return;
      }
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });
      console.log('Connected', accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error(error);
    }
  };

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

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xaa36a7" }],
        });
      } catch (error) {
        if ((error as any).code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0xaa36a7",
                  chainName: "Sepolia",
                  rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
                  nativeCurrency: {
                    name: "ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://sepolia.etherscan.io/"],
                },
              ],
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      alert("MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html");
    }
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

        const campaignCount = await contract.campaignCount();
        const deployedCampaigns = [];
        for (let i = 1; i <= campaignCount; i++) {
          const campaignDetails = await contract.getCampaignDetails(i);
          const campaign = {
            id: i,
            name: campaignDetails[0],
            UID: campaignDetails[1],
            budget: campaignDetails[2].toString(),
            numTasks: campaignDetails[3].toString(),
            payPerTask: campaignDetails[4].toString(),
            active: campaignDetails[5],
            remainingBudget: campaignDetails[6].toString(),
            entryCount: campaignDetails[7].toString(),
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
  }, []);

  useEffect(() => {
    if (currentAccount) {
      fetchCampaigns();
    }
  }, [currentAccount, network]);

  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
            sx={{ fontSize: '2rem', fontWeight: 'bold' }}
          >
            DataNill
          </Button>
        </Box>

        <Button color="inherit" component={RouterLink} to="/createcampaign">
          Campaigns
        </Button>
        <Button color="inherit" component={RouterLink} to="/operations">
          Submit Data
        </Button>
        <Button color="inherit" component={RouterLink} to="/blind-inference">
          Blind Validation
        </Button>

        <div className="flex rounded-lg px-5 py-3 mr-10 mt-2 gap-4">
          <div className="flex flex-col items-center mx-auto max-w-lg">
            <button
              onClick={connectWallet}
              className="h-12 bg-white text-black font-bold rounded-lg px-8 py-2 animate-gradient-animation"
            >
              {currentAccount ? 'Connected' : 'Connect Wallet'}
            </button>
          </div>
          <div className="bg-white text-black font-bold flex p-3 rounded-lg">
            {network === "Sepolia" ? (
              <p>
                Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}
              </p>
            ) : (
              <button onClick={switchNetwork} className="cta-button mint-button">
                Switch to Sepolia 
              </button>
            )}
          </div>
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
