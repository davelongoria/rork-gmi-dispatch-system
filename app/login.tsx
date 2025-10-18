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
import { CameraView, useCameraPermissions } from 'expo-camera';
import { QrCode, KeyRound, ArrowLeft } from 'lucide-react-native';

export default function LoginScreen() {
  const [usernameOrEmail, setUsernameOrEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showQRScanner, setShowQRScanner] = useState<boolean>(true);
  const [logoLoaded, setLogoLoaded] = useState<boolean>(false);
  const [permission, requestPermission] = useCameraPermissions();
  const auth = useAuth();
  const { theme, selectedCompany, isLoading: themeLoading, clearCompanySelection } = useTheme();
  const router = useRouter();

  const colors = theme.colors;

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
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={async () => {
              await clearCompanySelection();
              router.replace('/company-selection' as any);
            }}
          >
            <ArrowLeft size={24} color={colors.text} />
            <Text style={[styles.backButtonText, { color: colors.text }]}>Change Company</Text>
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: theme.logo }}
              style={styles.logo}
              resizeMode="contain"
              onLoad={() => setLogoLoaded(true)}
              onError={() => setLogoLoaded(false)}
            />
          </View>
          {!logoLoaded && <Text style={[styles.title, { color: colors.primary }]}>{theme.name}</Text>}
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Driver & Dispatch System</Text>
        </View>

        {showQRScanner ? (
          <View style={styles.qrContainer}>
            {Platform.OS === 'web' ? (
              <View style={[styles.qrPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                <QrCode size={48} color={colors.textSecondary} />
                <Text style={[styles.qrPlaceholderText, { color: colors.textSecondary }]}>
                  QR Scanner not available on web
                </Text>
                <TouchableOpacity
                  style={[styles.button, { marginTop: 16, backgroundColor: colors.primary }]}
                  onPress={() => setShowQRScanner(false)}
                >
                  <Text style={[styles.buttonText, { color: colors.background }]}>Use Email & Password</Text>
                </TouchableOpacity>
              </View>
            ) : !permission ? (
              <View style={[styles.qrPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : !permission.granted ? (
              <View style={[styles.qrPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                <QrCode size={48} color={colors.textSecondary} />
                <Text style={[styles.qrPlaceholderText, { color: colors.textSecondary }]}>
                  Camera permission required to scan QR codes
                </Text>
                <TouchableOpacity
                  style={[styles.button, { marginTop: 16, backgroundColor: colors.primary }]}
                  onPress={requestPermission}
                >
                  <Text style={[styles.buttonText, { color: colors.background }]}>Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary, { marginTop: 8, backgroundColor: colors.backgroundSecondary }]}
                  onPress={() => setShowQRScanner(false)}
                >
                  <Text style={[styles.buttonSecondaryText, { color: colors.text }]}>Use Email & Password</Text>
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
                  <View style={[styles.qrFrame, { borderColor: colors.primary }]} />
                  <Text style={styles.qrInstructions}>
                    Position QR code within the frame
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary, { marginTop: 16, backgroundColor: colors.backgroundSecondary }]}
                  onPress={() => setShowQRScanner(false)}
                >
                  <KeyRound size={20} color={colors.text} style={{ marginRight: 8 }} />
                  <Text style={[styles.buttonSecondaryText, { color: colors.text }]}>Use Email & Password</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Username or Email</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                placeholder="username or email@company.com"
                placeholderTextColor={colors.textSecondary}
                value={usernameOrEmail}
                onChangeText={setUsernameOrEmail}
                autoCapitalize="none"
                autoComplete="username"
                testID="username-email-input"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                placeholder="Enter password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                testID="password-input"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled, { backgroundColor: colors.primary }]}
              onPress={handleLogin}
              disabled={isLoading}
              testID="login-button"
            >
              {isLoading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.background }]}>Sign In</Text>
              )}
            </TouchableOpacity>

            {Platform.OS !== 'web' && (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary, { marginTop: 12, backgroundColor: colors.backgroundSecondary }]}
                onPress={() => setShowQRScanner(true)}
              >
                <QrCode size={20} color={colors.text} style={{ marginRight: 8 }} />
                <Text style={[styles.buttonSecondaryText, { color: colors.text }]}>Scan QR Code</Text>
              </TouchableOpacity>
            )}

            <View style={[styles.demoInfo, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.demoTitle, { color: colors.text }]}>Demo Accounts:</Text>
              <Text style={[styles.demoText, { color: colors.textSecondary }]}>Dispatcher: dispatcher@gmi.com or &quot;dispatcher&quot;</Text>
              <Text style={[styles.demoText, { color: colors.textSecondary }]}>Drivers: Use email or username set in Drivers screen</Text>
              <Text style={[styles.demoText, { color: colors.textSecondary }]}>Password: Set in driver settings (required if configured)</Text>
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
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 52,
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
    fontWeight: '600',
  },
  demoInfo: {
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 13,
    marginBottom: 4,
  },
  qrContainer: {
    width: '100%',
    alignItems: 'center',
  },
  qrScannerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  camera: {
    width: '100%',
    maxWidth: 320,
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  qrOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  qrFrame: {
    width: 250,
    height: 250,
    borderWidth: 4,
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  qrInstructions: {
    marginTop: 24,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  qrPlaceholderText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  buttonSecondary: {
    flexDirection: 'row',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
