const express = require('express');
const cors = require('cors');
const path = require('path');

const uploadRoutes = require('./routes/upload');
const statsRoutes = require('./routes/stats');
const packagesRoutes = require('./routes/packages');
const cvesRoutes = require('./routes/cves');
const dependenciesRoutes = require('./routes/dependencies');

const app = express();

app.use(cors());
app.use(express.json());

// In-memory storage for current SBOM analysis
const store = {
  currentAnalysis: null
};

// Make store available to routes
app.use((req, res, next) => {
  req.store = store;
  next();
});

// API routes
app.use('/api/upload', uploadRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/cves', cvesRoutes);
app.use('/api/dependencies', dependenciesRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

module.exports = app;
