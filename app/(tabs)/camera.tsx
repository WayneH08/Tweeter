import { Ionicons } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ScreenWrapper from "@/components/ScreenWrapper";
import { useTheme } from "@/lib/theme/ThemeContext";

export default function CameraScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme.colors);

  const cameraRef = useRef<CameraView | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  async function handleTakePhoto() {
    if (!cameraRef.current || isTakingPhoto) return;

    try {
      setIsTakingPhoto(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
      });

      if (photo?.uri) {
        setSelectedImage(photo.uri);
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Camera error",
        "Something went wrong while taking the photo.",
      );
    } finally {
      setIsTakingPhoto(false);
    }
  }

  async function handleUploadPhoto() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.85,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Upload error",
        "Something went wrong while choosing the photo.",
      );
    }
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  function handlePlaceholderIdentify() {
    Alert.alert(
      "Coming soon",
      "Bird identification will be added later. For now, this screen can capture or upload photos.",
    );
  }

  if (!permission) {
    return (
      <ScreenWrapper>
        <View style={styles.centerContainer}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <View style={styles.permissionCard}>
            <View style={styles.permissionIconCircle}>
              <Ionicons
                name="camera-outline"
                size={34}
                color={theme.colors.primary}
              />
            </View>

            <Text style={styles.title}>Camera Access Needed</Text>

            <Text style={styles.text}>
              Tweeter needs camera permission so you can take bird photos
              directly in the app.
            </Text>

            <Pressable style={styles.primaryButton} onPress={requestPermission}>
              <Ionicons
                name="camera"
                size={18}
                color={theme.colors.primaryText}
              />
              <Text style={styles.primaryButtonText}>Allow Camera Access</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={handleUploadPhoto}
            >
              <Ionicons
                name="image-outline"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.secondaryButtonText}>
                Upload Photo Instead
              </Text>
            </Pressable>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Camera</Text>
            <Text style={styles.title}>Bird Identification</Text>
          </View>

          <View style={styles.headerIconCircle}>
            <Ionicons
              name="scan-outline"
              size={24}
              color={theme.colors.primary}
            />
          </View>
        </View>

        <Text style={styles.text}>
          Take or upload a bird photo. Identification features will be added
          later.
        </Text>

        <View style={styles.cameraCard}>
          {selectedImage ? (
            <Image
              source={{ uri: selectedImage }}
              style={styles.previewImage}
            />
          ) : (
            <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
              <View style={styles.cameraOverlay}>
                <View style={[styles.corner, styles.topLeftCorner]} />
                <View style={[styles.corner, styles.topRightCorner]} />
                <View style={[styles.corner, styles.bottomLeftCorner]} />
                <View style={[styles.corner, styles.bottomRightCorner]} />

                <View style={styles.scanBadge}>
                  <Ionicons name="leaf-outline" size={16} color="#fff" />
                  <Text style={styles.scanBadgeText}>Place bird in frame</Text>
                </View>
              </View>
            </CameraView>
          )}
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.iconButton} onPress={handleUploadPhoto}>
            <Ionicons
              name="image-outline"
              size={24}
              color={theme.colors.primary}
            />
          </Pressable>

          {selectedImage ? (
            <Pressable
              style={styles.captureButton}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons
                name="refresh"
                size={30}
                color={theme.colors.primaryText}
              />
            </Pressable>
          ) : (
            <Pressable style={styles.captureButton} onPress={handleTakePhoto}>
              {isTakingPhoto ? (
                <ActivityIndicator color={theme.colors.primaryText} />
              ) : (
                <Ionicons
                  name="camera"
                  size={30}
                  color={theme.colors.primaryText}
                />
              )}
            </Pressable>
          )}

          <Pressable style={styles.iconButton} onPress={toggleCameraFacing}>
            <Ionicons
              name="camera-reverse-outline"
              size={24}
              color={theme.colors.primary}
            />
          </Pressable>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIconCircle}>
            <Ionicons
              name="sparkles-outline"
              size={22}
              color={theme.colors.primary}
            />
          </View>

          <View style={styles.infoTextArea}>
            <Text style={styles.infoTitle}>
              {selectedImage ? "Photo ready" : "Identification coming soon"}
            </Text>

            <Text style={styles.infoText}>
              {selectedImage
                ? "Later, this photo can be sent to a bird identification model."
                : "For now, this page focuses on camera capture, photo upload, and preview styling."}
            </Text>
          </View>
        </View>

        {selectedImage && (
          <View style={styles.bottomActions}>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons
                name="close-outline"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.secondaryButtonText}>Retake</Text>
            </Pressable>

            <Pressable
              style={styles.primaryButton}
              onPress={handlePlaceholderIdentify}
            >
              <Ionicons
                name="search-outline"
                size={18}
                color={theme.colors.primaryText}
              />
              <Text style={styles.primaryButtonText}>Identify Later</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

function createStyles(colors: {
  background: string;
  card: string;
  cardAlt: string;
  text: string;
  mutedText: string;
  border: string;
  primary: string;
  primaryText: string;
  inputBackground: string;
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
  danger: string;
}) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 15,
      color: colors.mutedText,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    eyebrow: {
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
      color: colors.primary,
      marginBottom: 3,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
    },
    text: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.mutedText,
      marginBottom: 18,
    },
    headerIconCircle: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cameraCard: {
      height: 420,
      borderRadius: 30,
      overflow: "hidden",
      backgroundColor: "#000",
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 5,
    },
    camera: {
      flex: 1,
    },
    cameraOverlay: {
      flex: 1,
      padding: 22,
      justifyContent: "space-between",
    },
    previewImage: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    corner: {
      position: "absolute",
      width: 46,
      height: 46,
      borderColor: "#ffffff",
    },
    topLeftCorner: {
      top: 22,
      left: 22,
      borderTopWidth: 4,
      borderLeftWidth: 4,
      borderTopLeftRadius: 12,
    },
    topRightCorner: {
      top: 22,
      right: 22,
      borderTopWidth: 4,
      borderRightWidth: 4,
      borderTopRightRadius: 12,
    },
    bottomLeftCorner: {
      bottom: 22,
      left: 22,
      borderBottomWidth: 4,
      borderLeftWidth: 4,
      borderBottomLeftRadius: 12,
    },
    bottomRightCorner: {
      bottom: 22,
      right: 22,
      borderBottomWidth: 4,
      borderRightWidth: 4,
      borderBottomRightRadius: 12,
    },
    scanBadge: {
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 18,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
    },
    scanBadgeText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "700",
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 28,
      marginTop: 20,
      marginBottom: 18,
    },
    iconButton: {
      width: 58,
      height: 58,
      borderRadius: 29,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    captureButton: {
      width: 78,
      height: 78,
      borderRadius: 39,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      borderWidth: 5,
      borderColor: colors.card,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
    },
    infoCard: {
      flexDirection: "row",
      gap: 14,
      padding: 16,
      borderRadius: 22,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.cardAlt,
    },
    infoTextArea: {
      flex: 1,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 4,
    },
    infoText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.mutedText,
    },
    bottomActions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 16,
    },
    primaryButton: {
      flex: 1,
      minHeight: 50,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
    },
    primaryButtonText: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.primaryText,
    },
    secondaryButton: {
      flex: 1,
      minHeight: 50,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
    },
    secondaryButtonText: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.primary,
    },
    permissionCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 26,
      padding: 22,
      gap: 14,
    },
    permissionIconCircle: {
      width: 62,
      height: 62,
      borderRadius: 31,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.cardAlt,
      marginBottom: 4,
    },
  });
}
