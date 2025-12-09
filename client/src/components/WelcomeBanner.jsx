import { Box, Typography, Avatar } from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import DistaLogo from '../assets/dista-logo.png';

export default function WelcomeBanner({ email, storeName }) {
  return (
    <Box
      sx={{
        background: 'linear-gradient(180deg, #848FFC 16.67%, #4F5596 265.15%);',
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
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          right: 120,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
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
              borderRadius: '200%',
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
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 4 }, mt: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              px: 2.5,
              py: 1.5,
            }}
          >
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 40, height: 40 }}>
              <StorefrontIcon sx={{ fontSize: 22 }} />
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.85, display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                Store Name
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {storeName}
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              px: 2.5,
              py: 1.5,
            }}
          >
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 40, height: 40, fontSize: '1rem', fontWeight: 600 }}>
              {email?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.85, display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                Email
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {email}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

