import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/colors';
import { DEFAULT_COMPANY } from '@/constants/haulingCompanies';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { QrCode, KeyRound } from 'lucide-react-native';

export default function LoginScreen() {
  const [usernameOrEmail, setUsernameOrEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showQRScanner, setShowQRScanner] = useState<boolean>(true);
  const [logoLoaded, setLogoLoaded] = useState<boolean>(false);
  const [permission, requestPermission] = useCameraPermissions();
  const auth = useAuth();
  const { selectedCompany, isLoading: themeLoading } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (themeLoading) {
      return;
    }

    if (!selectedCompany) {
      router.replace('/company-selection' as any);
      return;
    }

    if (auth && auth.isAuthenticated && !auth.isLoading) {
      if (auth.isDispatcher) {
        router.replace('/dispatcher' as any);
      } else if (auth.isDriver) {
        router.replace('/driver' as any);
      }
    } else if (auth && !auth.isAuthenticated && !auth.isLoading) {
      router.replace('/login' as any);
    }
  }, [auth, router, selectedCompany, themeLoading]);

  const handleLogin = async () => {
    if (!auth || !usernameOrEmail || !password) {
      Alert.alert('Error', 'Please enter username/email and password');
      return;
    }

    setIsLoading(true);
    const success = await auth.login(usernameOrEmail, password);
    setIsLoading(false);

    if (!success) {
      Alert.alert('Login Failed', 'Invalid credentials. Check your username/email and password.');
    }
  };

  const handleQRCodeScanned = async (data: string) => {
    if (!auth) return;
    
    setIsLoading(true);
    const success = await auth.loginWithQR(data);
    setIsLoading(false);

    if (!success) {
      Alert.alert('Login Failed', 'Invalid QR code or inactive driver account');
    }
  };

  if (!auth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: DEFAULT_COMPANY.logo }}
              style={styles.logo}
              resizeMode="contain"
              onLoad={() => setLogoLoaded(true)}
              onError={() => setLogoLoaded(false)}
            />
          </View>
          {!logoLoaded && <Text style={styles.title}>{DEFAULT_COMPANY.name}</Text>}
          <Text style={styles.subtitle}>Driver & Dispatch System</Text>
        </View>

        {showQRScanner ? (
          <View style={styles.qrContainer}>
            {Platform.OS === 'web' ? (
              <View style={styles.qrPlaceholder}>
                <QrCode size={48} color={Colors.textSecondary} />
                <Text style={styles.qrPlaceholderText}>
                  QR Scanner not available on web
                </Text>
                <TouchableOpacity
                  style={[styles.button, { marginTop: 16 }]}
                  onPress={() => setShowQRScanner(false)}
                >
                  <Text style={styles.buttonText}>Use Email & Password</Text>
                </TouchableOpacity>
              </View>
            ) : !permission ? (
              <View style={styles.qrPlaceholder}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : !permission.granted ? (
              <View style={styles.qrPlaceholder}>
                <QrCode size={48} color={Colors.textSecondary} />
                <Text style={styles.qrPlaceholderText}>
                  Camera permission required to scan QR codes
                </Text>
                <TouchableOpacity
                  style={[styles.button, { marginTop: 16 }]}
                  onPress={requestPermission}
                >
                  <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary, { marginTop: 8 }]}
                  onPress={() => setShowQRScanner(false)}
                >
                  <Text style={styles.buttonSecondaryText}>Use Email & Password</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.qrScannerContainer}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  onBarcodeScanned={({ data }) => {
                    if (data && !isLoading) {
                      handleQRCodeScanned(data);
                    }
                  }}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                />
                <View style={styles.qrOverlay}>
                  <View style={styles.qrFrame} />
                  <Text style={styles.qrInstructions}>
                    Position QR code within the frame
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary, { marginTop: 16 }]}
                  onPress={() => setShowQRScanner(false)}
                >
                  <KeyRound size={20} color={Colors.text} />
                  <Text style={[styles.buttonSecondaryText, { marginLeft: 8 }]}>Use Email & Password</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username or Email</Text>
              <TextInput
                style={styles.input}
                placeholder="username or email@company.com"
                placeholderTextColor={Colors.textSecondary}
                value={usernameOrEmail}
                onChangeText={setUsernameOrEmail}
                autoCapitalize="none"
                autoComplete="username"
                testID="username-email-input"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={Colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                testID="password-input"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              testID="login-button"
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.background} />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {Platform.OS !== 'web' && (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary, { marginTop: 12 }]}
                onPress={() => setShowQRScanner(true)}
              >
                <QrCode size={20} color={Colors.text} />
                <Text style={[styles.buttonSecondaryText, { marginLeft: 8 }]}>Scan QR Code</Text>
              </TouchableOpacity>
            )}

            <View style={styles.demoInfo}>
              <Text style={styles.demoTitle}>Demo Accounts:</Text>
              <Text style={styles.demoText}>Dispatcher: dispatcher@gmi.com or "dispatcher"</Text>
              <Text style={styles.demoText}>Drivers: Use email or username set in Drivers screen</Text>
              <Text style={styles.demoText}>Password: Set in driver settings (required if configured)</Text>
            </View>
          </View>
        )}
      </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 8,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center' as const,
    paddingVertical: 24,
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center' as const,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center' as const,
    marginBottom: 32,
  },
  logoContainer: {
    width: 200,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  button: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  demoInfo: {
    marginTop: 32,
    padding: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  demoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  qrContainer: {
    width: '100%',
    alignItems: 'center' as const,
  },
  qrScannerContainer: {
    width: '100%',
    alignItems: 'center' as const,
  },
  camera: {
    width: '100%',
    maxWidth: 320,
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden' as const,
  },
  qrOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    pointerEvents: 'none' as const,
  },
  qrFrame: {
    width: 250,
    height: 250,
    borderWidth: 4,
    borderColor: Colors.primary,
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  qrInstructions: {
    marginTop: 24,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
    textAlign: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  qrPlaceholder: {
    width: '100%',
    maxWidth: 320,
    aspectRatio: 1,
    borderRadius: 24,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 32,
  },
  qrPlaceholderText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  buttonSecondary: {
    backgroundColor: Colors.backgroundSecondary,
    flexDirection: 'row' as const,
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
