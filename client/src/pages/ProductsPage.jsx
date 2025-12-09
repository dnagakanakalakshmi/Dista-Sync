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

export default function ProductsPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
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

    fetchProducts();
  }, [user, navigate, authLoading]);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/data`, {
        params: { email: user.email, store: user.store },
      });
      if (data.token) {
        setProducts(data.products || []);
      } else {
        navigate('/home');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      if (err?.response?.status === 404) {
        navigate('/home');
      }
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (row) => {
    setEditDialog({ open: true, row });
    setEditForm({ 
      title: row.variantTitle && row.variantTitle !== 'Default Title' ? row.variantTitle : row.title, 
      price: row.price,
      inventory: row.inventory === '—' ? '' : row.inventory
    });
  };

  const handleEditSave = async () => {
    try {
      // Update product title and price
      await axios.post(`${API_URL}/api/products/update`, {
        email: user.email,
        productId: editDialog.row.productId,
        variantId: editDialog.row.variantId,
        title: editForm.title,
        price: editForm.price,
      });

      // Update inventory if changed and inventoryItemId exists
      if (
        editForm.inventory !== undefined && 
        editForm.inventory !== '' &&
        editDialog.row.inventoryItemId && 
        editDialog.row.locationId &&
        editForm.inventory !== editDialog.row.inventory
      ) {
        await axios.post(`${API_URL}/api/inventory/update`, {
          email: user.email,
          store: user.store,
          itemId: editDialog.row.inventoryItemId,
          locationId: editDialog.row.locationId,
          newQty: Number(editForm.inventory),
          currentQty: Number(editDialog.row.inventory === '—' ? 0 : editDialog.row.inventory),
        });
      }

      await fetchProducts();
      setEditDialog({ open: false, row: null });
      setMessage('Product updated successfully');
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

          {/* Products Table */}
          <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: '#4F5596' }}>
              Products
            </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Browse and update your product catalog
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
                        <TableCell sx={{ fontWeight: 600, color: '#4F5596' }}>ID</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#4F5596' }}>Title</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#4F5596' }}>Price</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#4F5596' }}>Inventory</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#4F5596' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product, idx) => (
                    <TableRow
                      key={idx}
                      sx={{
                        '&:hover': {
                          background: '#f7f7ff',
                        },
                      }}
                    >
                      <TableCell>{product.id}</TableCell>
                      <TableCell>{product.displayTitle || product.title}</TableCell>
                      <TableCell>{product.price}</TableCell>
                      <TableCell>{product.inventory}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={() => openEdit(product)}
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
                  {products.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No products found</Typography>
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
            <DialogTitle sx={{ fontWeight: 600, color: '#4F5596' }}>
          Edit {editDialog.row?.variantTitle && editDialog.row?.variantTitle !== 'Default Title' ? 'Variant' : 'Product'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={editDialog.row?.variantTitle && editDialog.row?.variantTitle !== 'Default Title' ? 'Variant Title' : 'Product Title'}
              value={editForm.title || ''}
              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                        borderColor: '#4F5596',
                  },
                },
              }}
            />
            <TextField
              label="Price"
              value={editForm.price || ''}
              onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                        borderColor: '#4F5596',
                  },
                },
              }}
            />
            <TextField
              label="Inventory"
              type="number"
              value={editForm.inventory || ''}
              onChange={(e) => setEditForm((f) => ({ ...f, inventory: e.target.value }))}
              fullWidth
              disabled={!editDialog.row?.inventoryItemId || !editDialog.row?.locationId}
              helperText={editDialog.row?.locationName ? `Location: ${editDialog.row.locationName}` : (!editDialog.row?.inventoryItemId ? 'No inventory tracking' : '')}
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
