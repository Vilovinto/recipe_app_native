import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors, radius } from '../../constants/theme';
import { RootStackParamList } from '../../types';

type SignUpScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignUp'>;

export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<SignUpScreenNavigationProp>();
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/recipe-app-caa91.firebasestorage.app/o/recipe-images%2FjfU84aSjTTX2qZlIyJpYyCM753K2%2FFrame.png?alt=media&token=9b9ca196-c9d2-47f2-b15f-da2bf14cb583';

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await signUp(email, password, firstName, lastName);
      navigation.replace('Main');
    } catch (error: any) {
      Alert.alert('Sign up failed', error.message || 'Could not sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.content}>
            <View style={styles.logoRow}>
              <Image source={{ uri: logoUrl }} style={styles.logoFullImage} resizeMode="contain" />
            </View>

            <View style={styles.headingBlock}>
              <Text style={styles.title}>Get Started</Text>
              <Text style={styles.subtitle}>Welcome! We're thrilled to have you</Text>
            </View>

            <View style={styles.form}>
            <View style={styles.nameRow}>
              <TextInput
                style={[styles.input, styles.nameInput]}
                placeholder="First name"
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                returnKeyType="next"
              />
              <TextInput
                style={[styles.input, styles.nameInput]}
                placeholder="Last name"
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="next"
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="done"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={[styles.googleButton, styles.buttonDisabled]} disabled>
                <View style={styles.googleInnerRow}>
                  <View style={styles.googleIconContainer}>
                    <View style={styles.googleIconTopRow}>
                      <View style={[styles.googleIconQuadrant, { backgroundColor: '#4285F4', borderTopLeftRadius: 12 }]} />
                      <View style={[styles.googleIconQuadrant, { backgroundColor: '#EA4335', borderTopRightRadius: 12 }]} />
                    </View>
                    <View style={styles.googleIconBottomRow}>
                      <View style={[styles.googleIconQuadrant, { backgroundColor: '#FBBC05', borderBottomLeftRadius: 12 }]} />
                      <View style={[styles.googleIconQuadrant, { backgroundColor: '#34A853', borderBottomRightRadius: 12 }]} />
                    </View>
                  </View>
                  <Text style={styles.googleButtonText}>Sign up with Google</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.signInLink}>
                <Text style={styles.signInText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                  <Text style={styles.signInLinkText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, padding: 24 },
  content: { flex: 1, width: '100%', justifyContent: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  logoFullImage: { width: 184, height: 32 },
  headingBlock: { gap: 8, marginBottom: 32 },
  title: { fontSize: 24, fontWeight: '500', color: colors.textPrimary },
  subtitle: { fontSize: 18, color: colors.textSecondary, marginBottom: 16 },
  form: { width: '100%' },
  nameRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  nameInput: { flex: 1 },
  input: {
    backgroundColor: 'transparent',
    borderRadius: radius.md,
    padding: 16,
    fontSize: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  button: { backgroundColor: colors.accent, borderRadius: 16, padding: 12, alignItems: 'center', marginBottom: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.darkText, fontSize: 18, fontWeight: '400' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#635B57' },
  dividerText: { color: 'rgba(255,255,255,0.6)', fontSize: 18 },
  googleButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    height: 56,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    paddingHorizontal: 16,
    minWidth: 200,
  },
  googleInnerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  googleIconContainer: { width: 24, height: 24, overflow: 'hidden' },
  googleIconTopRow: { flexDirection: 'row', width: 24, height: 12 },
  googleIconBottomRow: { flexDirection: 'row', width: 24, height: 12 },
  googleIconQuadrant: { width: 12, height: 12 },
  googleButtonText: { color: 'rgba(255,255,255,0.6)', fontSize: 18 },
  signInLink: { flexDirection: 'row', justifyContent: 'center' },
  signInText: { color: colors.textPrimary, fontSize: 18 },
  signInLinkText: { color: colors.accent, fontSize: 18, fontWeight: '400' },
});

