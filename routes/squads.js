// routes/squads.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Helper function to generate a unique squad code
const generateSquadCode = () => {
  // Generate a 6-character alphanumeric code
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Create a new squad
router.post('/', requireAuth, async (req, res) => {
  try {
    // Generate a unique squad code
    let code;
    let isUnique = false;
    
    while (!isUnique) {
      code = generateSquadCode();
      
      // Check if code already exists
      const existingSquad = await prisma.squad.findUnique({
        where: { code }
      });
      
      if (!existingSquad) {
        isUnique = true;
      }
    }
    
    // Create squad
    const squad = await prisma.squad.create({
      data: {
        code,
        leaderId: req.user.id,
        members: {
          create: {
            userId: req.user.id
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                isGuest: true
              }
            }
          }
        }
      }
    });
    
    // Format response
    const formattedSquad = {
      id: squad.id,
      code: squad.code,
      leaderId: squad.leaderId,
      createdAt: squad.createdAt,
      members: squad.members.map(member => ({
        id: member.user.id,
        username: member.user.username,
        isGuest: member.user.isGuest,
        joinedAt: member.joinedAt
      }))
    };
    
    res.status(201).json(formattedSquad);
  } catch (error) {
    console.error('Create squad error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join a squad by code
router.post('/join', requireAuth, [
  body('code').trim().isLength({ min: 6, max: 6 }).withMessage('Invalid squad code')
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { code } = req.body;
    
    // Find squad
    const squad = await prisma.squad.findUnique({
      where: { code },
      include: {
        members: true
      }
    });
    
    if (!squad) {
      return res.status(404).json({ error: 'Squad not found' });
    }
    
    // Check if squad is full (max 4 members)
    if (squad.members.length >= 4) {
      return res.status(400).json({ error: 'Squad is full' });
    }
    
    // Check if user is already a member
    const existingMember = squad.members.find(member => member.userId === req.user.id);
    if (existingMember) {
      return res.status(400).json({ error: 'You are already a member of this squad' });
    }
    
    // Add user to squad
    await prisma.squadMember.create({
      data: {
        squadId: squad.id,
        userId: req.user.id
      }
    });
    
    // Get updated squad with members
    const updatedSquad = await prisma.squad.findUnique({
      where: { id: squad.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                isGuest: true
              }
            }
          }
        }
      }
    });
    
    // Format response
    const formattedSquad = {
      id: updatedSquad.id,
      code: updatedSquad.code,
      leaderId: updatedSquad.leaderId,
      createdAt: updatedSquad.createdAt,
      members: updatedSquad.members.map(member => ({
        id: member.user.id,
        username: member.user.username,
        isGuest: member.user.isGuest,
        joinedAt: member.joinedAt
      }))
    };
    
    res.json(formattedSquad);
  } catch (error) {
    console.error('Join squad error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Leave a squad
router.post('/:id/leave', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find squad
    const squad = await prisma.squad.findUnique({
      where: { id },
      include: {
        members: true
      }
    });
    
    if (!squad) {
      return res.status(404).json({ error: 'Squad not found' });
    }
    
    // Check if user is a member
    const member = squad.members.find(member => member.userId === req.user.id);
    if (!member) {
      return res.status(400).json({ error: 'You are not a member of this squad' });
    }
    
    // If user is the leader and there are other members, transfer leadership
    if (squad.leaderId === req.user.id && squad.members.length > 1) {
      // Find another member to be the leader
      const newLeader = squad.members.find(member => member.userId !== req.user.id);
      
      // Update squad with new leader
      await prisma.squad.update({
        where: { id },
        data: {
          leaderId: newLeader.userId
        }
      });
    }
    
    // Remove user from squad
    await prisma.squadMember.deleteMany({
      where: {
        squadId: id,
        userId: req.user.id
      }
    });
    
    // If user was the only member, delete the squad
    if (squad.members.length === 1) {
      await prisma.squad.delete({
        where: { id }
      });
      
      return res.json({ message: 'Squad deleted' });
    }
    
    res.json({ message: 'Left squad successfully' });
  } catch (error) {
    console.error('Leave squad error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's current squad
router.get('/my-squad', requireAuth, async (req, res) => {
  try {
    // Find user's squad membership
    const membership = await prisma.squadMember.findFirst({
      where: { userId: req.user.id },
      include: {
        squad: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    isGuest: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!membership) {
      return res.json({ squad: null });
    }
    
    // Format response
    const formattedSquad = {
      id: membership.squad.id,
      code: membership.squad.code,
      leaderId: membership.squad.leaderId,
      createdAt: membership.squad.createdAt,
      members: membership.squad.members.map(member => ({
        id: member.user.id,
        username: member.user.username,
        isGuest: member.user.isGuest,
        joinedAt: member.joinedAt
      }))
    };
    
    res.json({ squad: formattedSquad });
  } catch (error) {
    console.error('Get my squad error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
