const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const electionRoutes = require('./routes/electionRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const voterRoutes = require('./routes/voterRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/elections', electionRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/voters', voterRoutes);

app.get('/', (req, res) => {
    res.send('Voto Legal API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
