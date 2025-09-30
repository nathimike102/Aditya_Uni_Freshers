import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase, ref, push, set, get, update, query, orderByChild, equalTo } from 'firebase/database';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const database = getDatabase(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

googleProvider.addScope('email');
googleProvider.addScope('profile');

const DEFAULT_EVENT_DETAILS = {
  eventName: 'Freshers Welcome 2025',
  eventDate: 'Thursday, October 2, 2025',
  eventTime: '12:00 PM - 6:00 PM',
  venue: 'Mysterious Location 🎭',
  price: '₹300',
  currency: 'INR',
  dressCode: 'Smart Casual',
  description: "Join us for an unforgettable Freshers' Party! Dance, music, games, and lots of fun await you. Don't miss this amazing opportunity to connect with your fellow classmates and create memories that will last a lifetime."
};

const EXTENDED_DEFAULT_EVENT_DETAILS = {
  ...DEFAULT_EVENT_DETAILS,
  eventDate: '2025-10-02',
  startTime: '12:00',
  endTime: '18:00',
  price: '300'
};

export const ADMIN_CONFIG = {
  adminEmails: [
    import.meta.env.VITE_ADMIN_EMAIL
  ].filter(Boolean),
  adminPassword: import.meta.env.VITE_ADMIN_PASSWORD,
  
  isAdmin: (email) => {
    if (!import.meta.env.VITE_ADMIN_EMAIL) {
      return false;
    }
    return ADMIN_CONFIG.adminEmails.includes(email?.toLowerCase());
  }
};

export const realtimeDB = {
  saveTicket: async (userId, ticket) => {
    try {
      const ticketsRef = ref(database, `tickets/${userId}`);
      const newTicketRef = push(ticketsRef);
      await set(newTicketRef, ticket);
      return { ...ticket, firebaseKey: newTicketRef.key };
    } catch (error) {
      throw error;
    }
  },
  
  getTickets: async (userId) => {
    try {
      const ticketsRef = ref(database, `tickets/${userId}`);
      const snapshot = await get(ticketsRef);
      if (snapshot.exists()) {
        const ticketsData = snapshot.val();
        return Object.keys(ticketsData).map(key => ({
          ...ticketsData[key],
          firebaseKey: key
        }));
      }
      return [];
    } catch (error) {
      return [];
    }
  },

  updateTicket: async (userId, ticketId, updates) => {
    try {
      const ticketsRef = ref(database, `tickets/${userId}`);
      const snapshot = await get(ticketsRef);
      
      if (snapshot.exists()) {
        const tickets = snapshot.val();
        for (const key in tickets) {
          if (tickets[key].id === ticketId) {
            const ticketRef = ref(database, `tickets/${userId}/${key}`);
            const updatedTicket = { ...tickets[key], ...updates };
            await update(ticketRef, updatedTicket);
            return updatedTicket;
          }
        }
      }
      throw new Error('Ticket not found');
    } catch (error) {
      throw error;
    }
  },

  findTicket: async (ticketId) => {
    try {
      const allTicketsRef = ref(database, 'tickets');
      const snapshot = await get(allTicketsRef);
      
      if (snapshot.exists()) {
        const allUsers = snapshot.val();
        for (const userId in allUsers) {
          const userTickets = allUsers[userId];
          for (const ticketKey in userTickets) {
            if (userTickets[ticketKey].id === ticketId) {
              return {
                ticket: userTickets[ticketKey],
                userId: userId,
                ticketKey: ticketKey
              };
            }
          }
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  admin: {
    getAllTickets: async () => {
      try {
        const allTicketsRef = ref(database, 'tickets');
        const snapshot = await get(allTicketsRef);
        const tickets = [];
        
        if (snapshot.exists()) {
          const allUsers = snapshot.val();
          for (const userId in allUsers) {
            const userTickets = allUsers[userId];
            for (const ticketKey in userTickets) {
              tickets.push({
                ...userTickets[ticketKey],
                userId: userId,
                firebaseKey: ticketKey
              });
            }
          }
        }
        return tickets;
      } catch (error) {
        throw error;
      }
    },

    updateEventDetails: async (eventDetails) => {
      try {
        const eventRef = ref(database, 'eventDetails');
        await set(eventRef, {
          ...eventDetails,
          updatedAt: new Date().toISOString()
        });
        return eventDetails;
      } catch (error) {
        throw error;
      }
    },

    getEventDetails: async () => {
      try {
        const eventRef = ref(database, 'eventDetails');
        const snapshot = await get(eventRef);
        
        if (snapshot.exists()) {
          return snapshot.val();
        }
        
        const defaultEventDetails = {
          ...DEFAULT_EVENT_DETAILS,
          createdAt: new Date().toISOString()
        };
        
        await set(eventRef, defaultEventDetails);
        return defaultEventDetails;
      } catch (error) {
        return DEFAULT_EVENT_DETAILS;
      }
    },

    generateAccessKey: async (keyData) => {
      try {
        const keysRef = ref(database, 'accessKeys');
        const newKeyRef = push(keysRef);
        await set(newKeyRef, {
          ...keyData,
          createdAt: new Date().toISOString(),
          isActive: true
        });
        return { ...keyData, firebaseKey: newKeyRef.key };
      } catch (error) {
        throw error;
      }
    },

    getAccessKeys: async () => {
      try {
        const keysRef = ref(database, 'accessKeys');
        const snapshot = await get(keysRef);
        
        if (snapshot.exists()) {
          const keysData = snapshot.val();
          return Object.keys(keysData).map(key => ({
            ...keysData[key],
            firebaseKey: key
          }));
        }
        return [];
      } catch (error) {
        return [];
      }
    },

    initializeDefaultData: async () => {
      try {
        const eventRef = ref(database, 'eventDetails');
        const eventSnapshot = await get(eventRef);
        
        if (!eventSnapshot.exists()) {
          const defaultEventDetails = {
            ...EXTENDED_DEFAULT_EVENT_DETAILS,
            createdAt: new Date().toISOString()
          };
          
          await set(eventRef, defaultEventDetails);
        }
        
        return true;
      } catch (error) {
        return false;
      }
    },

    validateAndUseAccessKey: async (keyCode, userId) => {
      try {
        const keysRef = ref(database, 'accessKeys');
        const snapshot = await get(keysRef);
        
        if (!snapshot.exists()) {
          throw new Error('No access keys found');
        }

        const keysData = snapshot.val();
        let validKey = null;
        let keyFirebaseId = null;

        for (const [firebaseId, keyData] of Object.entries(keysData)) {
          if (keyData.keyCode === keyCode.toUpperCase() && keyData.isActive) {
            if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
              throw new Error('Access key has expired');
            }
            
            const currentUses = keyData.usedCount || 0;
            if (currentUses >= keyData.maxUses) {
              throw new Error('Access key has reached maximum usage limit');
            }

            const usedBy = keyData.usedBy || [];
            if (usedBy.includes(userId)) {
              throw new Error('You have already used this access key');
            }

            validKey = keyData;
            keyFirebaseId = firebaseId;
            break;
          }
        }

        if (!validKey) {
          throw new Error('Invalid or inactive access key');
        }

        const keyUpdateRef = ref(database, `accessKeys/${keyFirebaseId}`);
        const updatedUsedBy = [...(validKey.usedBy || []), userId];
        const updatedUsedCount = (validKey.usedCount || 0) + 1;

        await update(keyUpdateRef, {
          usedCount: updatedUsedCount,
          usedBy: updatedUsedBy,
          lastUsedAt: new Date().toISOString(),
          lastUsedBy: userId
        });

        return {
          keyData: validKey,
          remainingUses: validKey.maxUses - updatedUsedCount
        };
      } catch (error) {
        throw error;
      }
    },

    scanTicket: async (ticketId, scanData) => {
      try {
        const ticketResult = await realtimeDB.findTicket(ticketId);
        
        if (!ticketResult) {
          throw new Error('Ticket not found');
        }

        const { ticket, userId } = ticketResult;
        
        if (ticket.isScanned) {
          throw new Error('Ticket already scanned');
        }

        const updates = {
          isScanned: true,
          scannedAt: new Date().toISOString(),
          scannedBy: scanData.adminEmail,
          scanLocation: scanData.location || 'Event Entrance'
        };

        return await realtimeDB.updateTicket(userId, ticket.id, updates);
      } catch (error) {
        throw error;
      }
    }
  },

  saveUserProfile: async (userId, profileData) => {
    try {
      const userProfileRef = ref(database, `userProfiles/${userId}`);
      const profileWithMetadata = {
        ...profileData,
        createdAt: profileData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await set(userProfileRef, profileWithMetadata);
      return profileWithMetadata;
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  },

  getUserProfile: async (userId) => {
    try {
      const userProfileRef = ref(database, `userProfiles/${userId}`);
      const snapshot = await get(userProfileRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },

  updateUserProfile: async (userId, updates) => {
    try {
      const userProfileRef = ref(database, `userProfiles/${userId}`);
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await update(userProfileRef, updatedData);
      return updatedData;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
};

export default app;
