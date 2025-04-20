// routes/playerData.js
const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Get player data
router.get('/', requireAuth, async (req, res) => {
  try {
    // Get player data
    const playerData = await prisma.playerData.findUnique({
      where: { userId: req.user.id }
    });

    if (!playerData) {
      return res.status(404).json({ error: 'Player data not found' });
    }

    res.json(playerData.gameData);
  } catch (error) {
    console.error('Get player data error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update player data
router.put('/', requireAuth, async (req, res) => {
  try {
    const { gameData } = req.body;

    if (!gameData) {
      return res.status(400).json({ error: 'Game data is required' });
    }

    // Update player data
    const updatedPlayerData = await prisma.playerData.upsert({
      where: { userId: req.user.id },
      update: { gameData },
      create: {
        userId: req.user.id,
        gameData
      }
    });

    res.json(updatedPlayerData.gameData);
  } catch (error) {
    console.error('Update player data error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
