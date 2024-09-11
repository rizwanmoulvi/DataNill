import { NillionClient } from '@nillion/client-web';
import React, { useState, useEffect } from 'react';
import { config } from '../helpers/nillion';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { truncateString } from '../helpers/truncateString';
import CopyableString from './CopyableString';

interface ConnectionInfoProps {
  client: NillionClient | null;
  userkey: string | null;
}

const ConnectionInfo: React.FC<ConnectionInfoProps> = ({ client, userkey }) => {
  return (
    <Box mb={2}>
      <List>
        <ListItem>
          <ListItemText>
            <strong>Campaign Key:</strong>{' '}
            {userkey ? (
              <CopyableString
                text={userkey}
                copyText={userkey}
                shouldTruncate={true}
                truncateLength={10}
                descriptor="Campaign key"
              />
            ) : (
              'Not set - connect with the campaign key'
            )}
          </ListItemText>
        </ListItem>

        <ListItem>
          <ListItemText>
            <strong>Campaign ID:</strong>{' '}
            {client?.user_id ? (
              <CopyableString
                text={client?.user_id}
                copyText={client?.user_id}
                shouldTruncate={true}
                truncateLength={10}
                descriptor="campaign id"
              />
            ) : (
              'Not set'
            )}
          </ListItemText>
        </ListItem>
      </List>
    </Box>
  );
};

export default ConnectionInfo;
