import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import axios from 'axios';
import DistaLogo from '../assets/dista-logo.png';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAuth = async () => {
    setMessage('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await axios.post(`${API_URL}/api/auth/register`, {
          email: form.email,
          password: form.password,
        });
        setMessage('Registered successfully. You can now log in.');
        setMode('login');
        setForm((prev) => ({ ...prev, password: '' }));
        setLoading(false);
        return;
      }

      const { data: userResp } = await axios.post(`${API_URL}/api/auth/login`, {
        email: form.email,
        password: form.password,
      });
      login(userResp);
      navigate('/home');
    } catch (err) {
      const errorMsg = err?.response?.data?.message || 'Something went wrong';
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'signup' && (!form.email || !form.password)) {
      setMessage('Please fill in email and password.');
      return;
    }
    if (mode === 'login' && (!form.email || !form.password)) {
      setMessage('Please fill in email and password.');
      return;
    }
    handleAuth();
  };

  return (
    <Box
      className="app-shell"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(180deg, #f2f3ff 0%, #e6e8ff 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={4}>
          {/* Header Banner */}
          <Box
            sx={{
              background: 'linear-gradient(180deg, #848FFC 0%, #4F5596 100%)',
              borderRadius: 4,
              p: { xs: 3, md: 4 },
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 32px -8px #848FFC',
            }}
          >
            {/* Decorative elements */}
            <Box
              sx={{
                position: 'absolute',
                top: -40,
                right: -40,
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -60,
                right: 80,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
              }}
            />
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 }, mb: 2 }}>
                {/* Logo */}
                <Box
                  component="img"
                  src={DistaLogo}
                  alt="Dista Logo"
                  sx={{
                    width: { xs: 60, md: 80 },
                    height: { xs: 60, md: 80 },
                    borderRadius: '50%',
                    flexShrink: 0,
                    objectFit: 'contain',
                  }}
                />
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1.75rem', md: '2.25rem' },
                  }}
                >
                  Welcome to Dista Sync
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.95 }}>
                Login or register to access your Shopify data
              </Typography>
            </Box>
          </Box>

          {/* Form Card */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: '#fff',
            }}
          >
            <Stack spacing={3}>
              <Tabs
                value={mode}
                onChange={(_e, val) => setMode(val)}
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    minHeight: 48,
                  },
                  '& .Mui-selected': {
                    color: '#848FFC',
                  },
                  '& .MuiTabs-indicator': {
                    background: 'linear-gradient(180deg, #848FFC 16.67%, #4F5596 265.15%);',
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                  },
                }}
              >
                <Tab value="login" label="Login" />
                <Tab value="signup" label="Sign up" />
              </Tabs>

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="Email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      fullWidth
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: '#848FFC',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#848FFC',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Password"
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      fullWidth
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: '#848FFC',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#848FFC',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={loading}
                      sx={{
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        background: 'linear-gradient(180deg, #848FFC 16.67%, #4F5596 265.15%)',
                        '&:hover': {
                          background: 'linear-gradient(180deg, #727AE8 16.67%, #40457C 265.15%)',
                        },
                        '&:disabled': {
                          background: '#848FFC',
                        },
                      }}
                    >
                      {loading ? 'Please wait…' : mode === 'signup' ? 'Register' : 'Login'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              {message && (
                <Alert
                  severity={message.includes('successfully') ? 'success' : 'error'}
                  sx={{
                    borderRadius: 2,
                    '& .MuiAlert-icon': {
                      color: message.includes('successfully')
                        ? '#848FFC'
                        : undefined,
                    },
                  }}
                >
                  {message}
                </Alert>
              )}
            </Stack>
          </Paper>

          {/* Footer */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              © 2025 Dista Sync. All rights reserved.
            </Typography>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
