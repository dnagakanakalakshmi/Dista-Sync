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
  Tabs,
  Tab,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
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
  const [shops, setShops] = useState([]);
  const [storesData, setStoresData] = useState([]);
  const [storeTabs, setStoreTabs] = useState([]); // per-store selected tab (orders/products/inventory)
  const [selectedStoreIdx, setSelectedStoreIdx] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }

    const checkToken = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/data`, {
          params: { email: user.email },
        });

        const stores = data.stores || [];
        const countsAgg = stores.reduce(
          (acc, s) => ({
            orders: acc.orders + (s.orders?.length || 0),
            products: acc.products + (s.products?.length || 0),
            inventory: acc.inventory + (s.inventory?.length || 0),
          }),
          { orders: 0, products: 0, inventory: 0 }
        );

        if (stores.length > 0) {
          setHasToken(true);
          setCounts(countsAgg);
          setShops(stores.map((s) => s.shop));
          setStoresData(stores);
          setStoreTabs(stores.map(() => 'orders'));
          setSelectedStoreIdx(0);
        } else {
          setHasToken(false);
          setStoresData([]);
          setStoreTabs([]);
          setSelectedStoreIdx(0);
        }
      } catch (err) {
        if (err?.response?.status === 404) {
          setHasToken(false);
        } else if (err?.response?.status === 403) {
          // User not onboarded
          setHasToken(false);
          console.log('User not onboarded:', err.response?.data?.message);
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
          <WelcomeBanner email={user?.email || ''} shops={shops} />

          {/* Token Status Alert */}
          {!hasToken && (
            <Alert severity="warning" sx={{ py: 2 }}>
              <Typography>
                No data found.
              </Typography>
            </Alert>
          )}

          {/* Quick Navigation per selected store */}
          {hasToken && storesData.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}>
                    Quick Navigation
                  </Typography>
                  {storesData.length === 1 && (
                    <Typography variant="subtitle1" sx={{ color: '#4F5596', fontWeight: 500 }}>
                      {storesData[0].shop || 'Store'}
                    </Typography>
                  )}
                </Box>
                {storesData.length > 1 && (
                  <Tabs
                    value={selectedStoreIdx}
                    onChange={(_, v) => setSelectedStoreIdx(v)}
                    sx={{
                      '& .MuiTab-root': { fontWeight: 600 },
                      '& .Mui-selected': { color: '#4F5596' },
                      '& .MuiTabs-indicator': { backgroundColor: '#4F5596' },
                    }}
                  >
                    {storesData.map((s, idx) => (
                      <Tab key={s.shop || idx} label={s.shop || `Store ${idx + 1}`} />
                    ))}
                  </Tabs>
                )}
              </Box>

              <Grid container spacing={3} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                <NavigationCard
                  title="Orders"
                  description="View and manage all your customer orders"
                  icon={ShoppingCartIcon}
                  to={`/orders?store=${encodeURIComponent(storesData[selectedStoreIdx]?.shop || '')}`}
                  count={storesData[selectedStoreIdx]?.orders?.length || 0}
                />
                <NavigationCard
                  title="Products"
                  description="Browse and update your product catalog"
                  icon={CategoryIcon}
                  to={`/products?store=${encodeURIComponent(storesData[selectedStoreIdx]?.shop || '')}`}
                  count={storesData[selectedStoreIdx]?.products?.length || 0}
                />
                <NavigationCard
                  title="Inventory"
                  description="Track stock levels and manage inventory"
                  icon={InventoryIcon}
                  to={`/inventory?store=${encodeURIComponent(storesData[selectedStoreIdx]?.shop || '')}`}
                  count={storesData[selectedStoreIdx]?.inventory?.length || 0}
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
