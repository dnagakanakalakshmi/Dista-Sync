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
  MenuItem,
} from '@mui/material';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function OrdersPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editDialog, setEditDialog] = useState({ open: false, row: null });
  const [editForm, setEditForm] = useState({});
  const [viewDialog, setViewDialog] = useState({ open: false, order: null });

  useEffect(() => {
    if (authLoading) return;

    if (!user?.email) {
      navigate('/login');
      return;
    }

    fetchOrders();
  }, [user, navigate, authLoading]);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/data`, {
        params: { email: user.email, store: user.store, _t: Date.now() },
      });
      if (data.token) {
        setOrders(data.orders || []);
      } else {
        navigate('/home');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      if (err?.response?.status === 404) {
        navigate('/home');
      }
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (row) => {
    setEditDialog({ open: true, row });
    setEditForm({ status: row.status && row.status !== '—' ? row.status : '' });
  };

  const openView = (order) => {
    setViewDialog({ open: true, order });
  };

  const handleEditSave = async () => {
    try {
      await axios.post(`${API_URL}/api/orders/update`, {
        email: user.email,
        store: user.store,
        orderId: editDialog.row.orderId,
        status: editForm.status,
      });
      // Wait 2 seconds for Shopify to process the cancellation
      await new Promise(resolve => setTimeout(resolve, 2000));
      await fetchOrders();
      setEditDialog({ open: false, row: null });
      setMessage('Order updated successfully');
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

          {/* Orders Table */}
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: '#4F5596' }}>
              Orders
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              View and manage all your customer orders
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                }}
              >
                <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow sx={{ background: '#f2f3ff' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#4F5596' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#4F5596' }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#4F5596' }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#4F5596' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#4F5596' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order, idx) => (
                    <TableRow
                      key={idx}
                      sx={{
                        '&:hover': {
                          background: '#f7f7ff',
                        },
                      }}
                    >
                      <TableCell>{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{order.total}</TableCell>
                      <TableCell>
                        <Box
                          component="span"
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 2,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: 'linear-gradient(180deg, #848FFC 16.67%, #4F5596 265.15%)',
                            color: '#fff',
                          }}
                        >
                          {order.status}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button
                            size="small"
                            onClick={() => openView(order)}
                            sx={{
                              background: 'linear-gradient(180deg, #848FFC 16.67%, #4F5596 265.15%)',
                              color: '#fff',
                              '&:hover': {
                                background: 'linear-gradient(180deg, #727AE8 16.67%, #40457C 265.15%)',
                              },
                            }}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            onClick={() => openEdit(order)}
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
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {orders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No orders found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{ textAlign: 'center', pt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              © 2025 Dista Sync. All rights reserved.
            </Typography>
          </Box>
        </Stack>
      </Container>

      {/* View Order Dialog */}
      <Dialog
        open={viewDialog.open}
        onClose={() => setViewDialog({ open: false, order: null })}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogContent sx={{ pt: 2 }}>
          {viewDialog.order && (
            <Stack spacing={3}>
              {/* Header Info */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 2, borderBottom: '1px solid #e0e0e0' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#4F5596' }}>
                    Order {viewDialog.order.id}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                    {viewDialog.order.customer}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Box
                    component="div"
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 2,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: 'linear-gradient(180deg, #848FFC 16.67%, #4F5596 265.15%)',
                      color: '#fff',
                      display: 'inline-block',
                      mt: 1,
                    }}
                  >
                    {viewDialog.order.status}
                  </Box>
                  <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, display: 'block', mt: 1.5 }}>
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#4F5596' }}>
                    {viewDialog.order.total}
                  </Typography>
                </Box>
              </Box>

              {/* Line Items */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#4F5596' }}>
                  Line Items
                </Typography>
                <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ background: '#f2f3ff' }}>
                        <TableCell sx={{ fontWeight: 600, color: '#4F5596' }}>ID</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#4F5596' }}>Title</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, color: '#4F5596' }}>Quantity</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#4F5596' }}>Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {viewDialog.order.lineItems && viewDialog.order.lineItems.length > 0 ? (
                        viewDialog.order.lineItems.map((item, idx) => (
                          <TableRow key={idx} sx={{ '&:hover': { background: '#f7f7ff' } }}>
                            <TableCell>{item.id || item.variantId || '—'}</TableCell>
                            <TableCell>{item.title || item.name || '—'}</TableCell>
                            <TableCell align="center">{item.quantity || '—'}</TableCell>
                            <TableCell align="right">{item.price || '—'}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 2, color: 'text.secondary' }}>
                            No line items available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Paper>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setViewDialog({ open: false, order: null })}>Close</Button>
        </DialogActions>
      </Dialog>

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
        <DialogTitle sx={{ fontWeight: 600, color: '#4F5596' }}>Edit Order</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Order ID"
              value={editDialog.row?.id || ''}
              fullWidth
              disabled
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#4F5596',
                  },
                },
              }}
            />
            <TextField
              label="Customer"
              value={editDialog.row?.customer || ''}
              fullWidth
              disabled
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#4F5596',
                  },
                },
              }}
            />
            <TextField
              select
              label="Status"
              value={editForm.status || ''}
              onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#4F5596',
                  },
                },
              }}
            >
              {!editForm.status && <MenuItem value="">Select status</MenuItem>}
              <MenuItem value="UNSHIPPED">Unshipped</MenuItem>
              <MenuItem value="PARTIALLY_SHIPPED">Partially Shipped</MenuItem>
              <MenuItem value="SHIPPED">Shipped</MenuItem>
              <MenuItem value="PARTIALLY_FULFILLED">Partially Fulfilled</MenuItem>
              <MenuItem value="FULFILLED">Fulfilled</MenuItem>
              <MenuItem value="RESTOCKED">Restocked</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </TextField>
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