import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getUsersCollection } from './models';

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || 'dummy',
      clientSecret: process.env.GOOGLE_SECRET || 'dummy',
      async profile(profile) {
        return {
          id: profile.sub,
          name: profile.given_name ? profile.given_name : profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const usersCollection = await getUsersCollection();
          
          const user = await usersCollection.findOne({ 
            email: credentials.email.toLowerCase() 
          });
          
          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile: _profile }) {
      if (account?.provider === 'google') {
        try {
          const usersCollection = await getUsersCollection();
          
          // Check if user already exists
          let dbUser = await usersCollection.findOne({ email: user.email });
          
          if (!dbUser) {
            // Create new user if doesn't exist with empty collection
            const newUser = {
              name: user.name,
              email: user.email,
              image: user.image,
              provider: 'google',
              collection: [], // Initialize empty collection array
              createdAt: new Date(),
              updatedAt: new Date()
            };
            const result = await usersCollection.insertOne(newUser);
            dbUser = { ...newUser, _id: result.insertedId };
          } else {
            // Ensure existing users have a collection array
            if (!dbUser.collection) {
              await usersCollection.updateOne(
                { _id: dbUser._id },
                { 
                  $set: { 
                    collection: [],
                    updatedAt: new Date()
                  }
                }
              );
              dbUser.collection = [];
            }
          }
          
          // Update user object with database ID
          user.id = dbUser._id.toString();
          
          return true;
        } catch (error) {
          console.error('Google sign-in error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account: _account }) {
      // Initial sign in - store essential user data
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.image;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
};

export default NextAuth(authOptions);
