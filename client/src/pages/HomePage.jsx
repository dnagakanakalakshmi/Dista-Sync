import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  Alert,
  Grid,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import axios from 'axios';
import WelcomeBanner from '../components/WelcomeBanner';
import NavigationCard from '../components/NavigationCard';
import LoadingSpinner from '../components/LoadingSpinner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function HomePage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [hasToken, setHasToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ orders: 0, products: 0, inventory: 0 });

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }

    const checkToken = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/data`, {
          params: { email: user.email, store: user.store },
        });
        if (data.token) {
          setHasToken(true);
          setCounts({
            orders: data.orders?.length || 0,
            products: data.products?.length || 0,
            inventory: data.inventory?.length || 0,
          });
        } else {
          setHasToken(false);
        }
      } catch (err) {
        if (err?.response?.status === 404) {
          setHasToken(false);
        } else {
          console.error('Error checking token:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [user, navigate, authLoading]);

  if (authLoading || loading) {
    return (
      <Box className="app-shell loading" sx={{ justifyContent: 'center' }}>
        <LoadingSpinner />
      </Box>
    );
  }

  return (
    <Box className="app-shell" sx={{ minHeight: '100vh', pb: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          {/* Header with Logout */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              sx={{
                borderColor: '#4F5596',
                color: '#4F5596',
                '&:hover': {
                  borderColor: '#4F5596',
                  background: '#f2f3ff',
                },
              }}
            >
              Logout
            </Button>
          </Box>

          {/* Welcome Banner */}
          <WelcomeBanner email={user?.email || ''} storeName={user?.store || ''} />

          {/* Token Status Alert */}
          {!hasToken && (
            <Alert severity="warning" sx={{ py: 2 }}>
              <Typography>
                Please install the Dista Sync App to grant access and view your data.
              </Typography>
            </Alert>
          )}

          {/* Quick Navigation */}
          {hasToken && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                Quick Navigation
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Access your most important sections
              </Typography>
              <Grid container spacing={3} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                <NavigationCard
                  title="Orders"
                  description="View and manage all your customer orders"
                  icon={ShoppingCartIcon}
                  to="/orders"
                  count={counts.orders}
                />
                <NavigationCard
                  title="Products"
                  description="Browse and update your product catalog"
                  icon={CategoryIcon}
                  to="/products"
                  count={counts.products}
                />
                <NavigationCard
                  title="Inventory"
                  description="Track stock levels and manage inventory"
                  icon={InventoryIcon}
                  to="/inventory"
                  count={counts.inventory}
                />
              </Grid>
            </Box>
          )}

          {/* Footer */}
          <Box sx={{ textAlign: 'center', pt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              © 2025 Dista Sync. All rights reserved.
            </Typography>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
