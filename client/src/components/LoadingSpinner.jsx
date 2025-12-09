import { Box, Typography } from '@mui/material';

export default function LoadingSpinner() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: 4,
      }}
    >
      <div className="loading-spinner"></div>
      <Typography color="text.secondary">Loading...</Typography>
    </Box>
  );
}
