/**
 * Camera overlay component: receipt frame guide, tips, and capture controls.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const FRAME_WIDTH = width * 0.85;
const FRAME_HEIGHT = FRAME_WIDTH * 1.4; // Typical receipt aspect ratio

interface ScanOverlayProps {
  onCapture: () => void;
  onPickFromGallery: () => void;
  onCancel: () => void;
  isCapturing?: boolean;
}

export default function ScanOverlay({
  onCapture,
  onPickFromGallery,
  onCancel,
  isCapturing = false,
}: ScanOverlayProps) {
  return (
    <View style={styles.container}>
      {/* Darkened regions outside the receipt frame */}
      <View style={styles.topOverlay} />
      <View style={styles.middleRow}>
        <View style={styles.sideOverlay} />

        {/* Receipt frame */}
        <View style={styles.frame}>
          {/* Corner markers */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        <View style={styles.sideOverlay} />
      </View>
      <View style={styles.bottomOverlay} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Receipt</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tip text */}
      <View style={styles.tipContainer}>
        <Text style={styles.tipText}>
          Position the receipt within the frame
        </Text>
        <Text style={styles.tipSubText}>
          Ensure good lighting for best results
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={onPickFromGallery}
          disabled={isCapturing}
        >
          <Text style={styles.galleryIcon}>🖼</Text>
          <Text style={styles.galleryLabel}>Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
          onPress={onCapture}
          disabled={isCapturing}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>

        {/* Spacer for symmetry */}
        <View style={styles.galleryButton} />
      </View>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: (height - FRAME_HEIGHT) / 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  middleRow: {
    position: 'absolute',
    top: (height - FRAME_HEIGHT) / 2,
    left: 0,
    right: 0,
    height: FRAME_HEIGHT,
    flexDirection: 'row',
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  frame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: (height - FRAME_HEIGHT) / 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#fff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 60,
  },
  tipContainer: {
    position: 'absolute',
    top: (height - FRAME_HEIGHT) / 2 - 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tipText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  tipSubText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  galleryButton: {
    width: 60,
    alignItems: 'center',
  },
  galleryIcon: {
    fontSize: 28,
  },
  galleryLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },
});
