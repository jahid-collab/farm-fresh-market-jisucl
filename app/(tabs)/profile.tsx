
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import { supabase } from '@/app/integrations/supabase/client';

export default function ProfileScreen() {
  const router = useRouter();
  const [profileData, setProfileData] = useState({
    full_name: 'John Farmer',
    email: 'john.farmer@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
  });
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsSignedIn(!!user);
      
      if (user) {
        // Load profile data
        const { data: profile } = await supabase
          .from('farmer_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setProfileData({
            full_name: profile.full_name || 'User',
            email: profile.email || user.email || '',
            avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
          });
        } else {
          setProfileData({
            full_name: 'User',
            email: user.email || '',
            avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
          });
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  const handleEditProfile = () => {
    if (!isSignedIn) {
      Alert.alert('Sign In Required', 'Please sign in to edit your profile');
      return;
    }
    router.push('/edit-profile');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              setIsSignedIn(false);
              Alert.alert('Success', 'You have been logged out');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    { icon: 'person', label: 'Edit Profile', route: '/edit-profile', onPress: handleEditProfile },
    { icon: 'location_on', label: 'Addresses', route: '/addresses' },
    { icon: 'payment', label: 'Payment Methods', route: '/payment' },
    { icon: 'history', label: 'Order History', route: '/orders' },
    { icon: 'notifications', label: 'Notifications', route: '/notifications' },
    { icon: 'help', label: 'Help & Support', route: '/support' },
    { icon: 'settings', label: 'Settings', route: '/settings' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: profileData.avatar_url }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatarButton} onPress={handleEditProfile}>
              <IconSymbol
                ios_icon_name="camera.fill"
                android_material_icon_name="camera_alt"
                size={16}
                color={colors.card}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{profileData.full_name}</Text>
          <Text style={styles.email}>{profileData.email}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>24</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={item.onPress || (() => {
                  if (!isSignedIn) {
                    Alert.alert('Sign In Required', 'Please sign in to access this feature');
                  } else {
                    Alert.alert('Coming Soon', `${item.label} feature will be available soon!`);
                  }
                })}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconContainer}>
                    <IconSymbol
                      ios_icon_name={item.icon}
                      android_material_icon_name={item.icon}
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </View>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron_right"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {isSignedIn ? (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <IconSymbol
              ios_icon_name="arrow.right.square"
              android_material_icon_name="logout"
              size={20}
              color={colors.card}
            />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={() => Alert.alert('Sign In', 'Sign in feature will be implemented')}
          >
            <IconSymbol
              ios_icon_name="arrow.right.square"
              android_material_icon_name="login"
              size={20}
              color={colors.card}
            />
            <Text style={styles.logoutText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.highlight,
  },
  menuContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.highlight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
  },
});
