import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  ListItemIcon,
  Divider,
  Tooltip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';

const UserMenu = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  // Mock user state (in a real app, this would come from your auth context)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogin = () => {
    // Mock login functionality
    setIsLoggedIn(true);
    handleClose();
  };
  
  const handleLogout = () => {
    // Mock logout functionality
    setIsLoggedIn(false);
    handleClose();
  };

  return (
    <>
      <Tooltip title="User Account">
        <IconButton 
          onClick={handleClick}
          size="small"
          sx={{ 
            p: 1,
            color: 'primary.light',
            '&:hover': {
              color: 'primary.main'
            }
          }}
        >
          {isLoggedIn ? (
            <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.light' }}>U</Avatar>
          ) : (
            <PersonIcon />
          )}
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            }
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {isLoggedIn ? (
          <>
            <MenuItem>
              <Avatar sx={{ bgcolor: 'primary.light' }}>U</Avatar>
              User Profile
            </MenuItem>
            <Divider />
            <MenuItem>
              <ListItemIcon>
                <SettingsIcon fontSize="small" sx={{ color: 'primary.light' }} />
              </ListItemIcon>
              Account Settings
            </MenuItem>
            <MenuItem>
              <ListItemIcon>
                <DeleteIcon fontSize="small" sx={{ color: 'primary.light' }} />
              </ListItemIcon>
              Delete Projects
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" sx={{ color: 'primary.light' }} />
              </ListItemIcon>
              Logout
            </MenuItem>
          </>
        ) : (
          <>
            <MenuItem onClick={handleLogin}>
              <ListItemIcon>
                <LoginIcon fontSize="small" sx={{ color: 'primary.light' }} />
              </ListItemIcon>
              Login
            </MenuItem>
            <MenuItem>
              <ListItemIcon>
                <PersonAddIcon fontSize="small" sx={{ color: 'primary.light' }} />
              </ListItemIcon>
              Sign Up
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};

export default UserMenu; 