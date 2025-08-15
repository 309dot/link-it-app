'use client';

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Link as LinkIcon,
  Dashboard,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        {/* 로고 */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <LinkIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" fontWeight="bold">
            Link-It
          </Typography>
        </Box>

        {/* 데스크톱 네비게이션 */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
          <Button
            component={Link}
            href="/"
            color="inherit"
            startIcon={<LinkIcon />}
          >
            링크 생성
          </Button>
          <Button
            component={Link}
            href="/dashboard"
            color="inherit"
            startIcon={<Dashboard />}
          >
            대시보드
          </Button>
        </Box>

        {/* 모바일 메뉴 */}
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            size="large"
            aria-label="메뉴"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <MenuIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem
              component={Link}
              href="/"
              onClick={handleClose}
            >
              <LinkIcon sx={{ mr: 1 }} />
              링크 생성
            </MenuItem>
            <MenuItem
              component={Link}
              href="/dashboard"
              onClick={handleClose}
            >
              <Dashboard sx={{ mr: 1 }} />
              대시보드
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
