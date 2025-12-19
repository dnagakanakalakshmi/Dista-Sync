import { Card, CardContent, Typography, Box } from '@mui/material';
import { Link } from 'react-router-dom';

export default function NavigationCard({ title, description, icon: Icon, to, count }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <Card
        sx={{
          height: '100%',
         
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 32px -8px #848FFC',
            '& .icon-box': {
              background: 'linear-gradient(180deg, #848FFC 16.67%, #4F5596 265.15%);',
              '& svg': {
                color: '#ffffff',
              },
            },
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(180deg, #848FFC 16.67%, #4F5596 265.15%);',
            opacity: 0,
            transition: 'opacity 0.3s ease',
          },
          '&:hover::before': {
            opacity: 1,
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box
              className="icon-box"
              sx={{
                width: 56,
                height: 56,
                borderRadius: 3,
                background: '#e7e8f5ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                flexShrink: 0,
              }}
            >
              <Icon sx={{ fontSize: 28, color: '#848FFC', transition: 'color 0.3s ease' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {title}
                </Typography>
                {count !== undefined && (
                  <Box
                    sx={{
                      background: 'linear-gradient(180deg, #848FFC 16.67%, #4F5596 265.15%);',
                      color: '#fff',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 2,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {count}
                  </Box>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Link>
  );
}


