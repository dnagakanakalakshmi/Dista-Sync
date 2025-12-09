import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function InventoryPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState({ open: false, row: null });
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }

    fetchInventory();
  }, [user, navigate, authLoading]);

  const fetchInventory = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/data`, {
        params: { email: user.email, store: user.store },
      });
      if (data.token) {
        setInventory(data.inventory || []);
      } else {
        navigate('/home');
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      if (err?.response?.status === 404) {
        navigate('/home');
      }
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (row) => {
    setEditDialog({ open: true, row });
    setEditForm({ qty: row.qty });
  };

  const handleEditSave = async () => {
    try {
      await axios.post(`${API_URL}/api/inventory/update`, {
        email: user.email,
        itemId: editDialog.row.itemId,
        locationId: editDialog.row.locationId,
        newQty: editForm.qty,
        currentQty: editDialog.row.qty,
      });
      await fetchInventory();
      setEditDialog({ open: false, row: null });
      setMessage('Inventory updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Update failed');
    }
  };

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
          {/* Header with Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/home')}
              sx={{
                background: 'linear-gradient(180deg, #848FFC 16.67%, #4F5596 265.15%)',
                color: '#fff',
                '&:hover': {
                  background: 'linear-gradient(180deg, #727AE8 16.67%, #40457C 265.15%)',
                },
              }}
            >
              ← Back to Home
            </Button>
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

          {/* Message Alert */}
          {message && (
            <Alert severity={message.includes('successfully') ? 'success' : 'error'} sx={{ py: 2 }}>
              {message}
            </Alert>
          )}

          {/* Inventory Table */}
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: '#4F5596' }}>
              Inventory
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Track stock levels and manage inventory
            </Typography>
            <Paper
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ background: '#f2f3ff' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#4F5596' }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#4F5596' }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#4F5596' }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#4F5596' }}>Quantity</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#4F5596' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.map((item, idx) => (
                    <TableRow
                      key={idx}
                      sx={{
                        '&:hover': {
                          background: '#f7f7ff',
                        },
                      }}
                    >
                    <TableCell>{item.title}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.location}</TableCell>
                      <TableCell>{item.qty}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={() => openEdit(item)}
                          sx={{
                            background: 'linear-gradient(180deg, #848FFC 16.67%, #4F5596 265.15%)',
                            color: '#fff',
                            '&:hover': {
                              background: 'linear-gradient(180deg, #727AE8 16.67%, #40457C 265.15%)',
                            },
                          }}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {inventory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No inventory found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Box>

          {/* Footer */}
          <Box sx={{ textAlign: 'center', pt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              © 2025 Dista Sync. All rights reserved.
            </Typography>
          </Box>
        </Stack>
      </Container>

      {/* Edit Dialog */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, row: null })}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#4F5596' }}>Edit Inventory</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Quantity"
              type="number"
              value={editForm.qty || ''}
              onChange={(e) => setEditForm((f) => ({ ...f, qty: e.target.value }))}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#4F5596',
                  },
                },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setEditDialog({ open: false, row: null })}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleEditSave}
            sx={{
                background: 'linear-gradient(180deg, #848FFC 16.67%, #4F5596 265.15%)',
                '&:hover': {
                  background: 'linear-gradient(180deg, #727AE8 16.67%, #40457C 265.15%)',
                },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
