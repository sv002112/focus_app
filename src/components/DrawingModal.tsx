import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

interface PathPoint {
  x: number;
  y: number;
}

interface Path {
  id: string;
  points: PathPoint[];
  color: string;
  strokeWidth: number;
}

interface DrawingModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveDrawing: (svgUri: string) => void;
}

const STROKE_COLORS = ['#000000', '#1A73E8', '#EA4335', '#34A853', '#FBBC04', '#9C27B0', '#FF9800'];
const STROKE_WIDTHS = [2, 5, 10];

export const DrawingModal: React.FC<DrawingModalProps> = ({
  visible,
  onClose,
  onSaveDrawing,
}) => {
  const [paths, setPaths] = useState<Path[]>([]);
  const [currentPath, setCurrentPath] = useState<PathPoint[]>([]);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedWidth, setSelectedWidth] = useState(4);

  const currentPathRef = useRef<PathPoint[]>([]);
  currentPathRef.current = currentPath;

  const selectedColorRef = useRef(selectedColor);
  selectedColorRef.current = selectedColor;

  const selectedWidthRef = useRef(selectedWidth);
  selectedWidthRef.current = selectedWidth;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const newPoint = { x: locationX, y: locationY };
        currentPathRef.current = [newPoint];
        setCurrentPath([newPoint]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const newPoint = { x: locationX, y: locationY };
        const updated = [...currentPathRef.current, newPoint];
        currentPathRef.current = updated;
        setCurrentPath(updated);
      },
      onPanResponderRelease: () => {
        if (currentPathRef.current.length > 0) {
          const finishedPath: Path = {
            id: Date.now().toString() + Math.random(),
            points: currentPathRef.current,
            color: selectedColorRef.current,
            strokeWidth: selectedWidthRef.current,
          };
          setPaths((prev) => [...prev, finishedPath]);
        }
        currentPathRef.current = [];
        setCurrentPath([]);
      },
    })
  ).current;

  const [containerSize, setContainerSize] = useState({ width: 600, height: 400 });

  const handleClear = () => {
    setPaths([]);
    setCurrentPath([]);
  };

  const handleSave = () => {
    if (paths.length === 0) {
      onClose();
      return;
    }

    // 1. Calculate bounding box of all points across all paths
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let hasPoints = false;

    paths.forEach((p) => {
      p.points.forEach((pt) => {
        hasPoints = true;
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      });
    });

    if (!hasPoints || minX >= maxX || minY >= maxY) {
      minX = 0;
      maxX = containerSize.width || 600;
      minY = 0;
      maxY = containerSize.height || 400;
    }

    // 2. Add padding around drawing
    const padding = 24;
    const cropX = Math.max(0, minX - padding);
    const cropY = Math.max(0, minY - padding);
    const cropW = Math.max(120, (maxX - minX) + padding * 2);
    const cropH = Math.max(120, (maxY - minY) + padding * 2);

    let drawingDataUri = '';

    // 3. Export as high-resolution PNG Data URI on Web environment
    if (typeof document !== 'undefined' && document.createElement) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(cropW);
        canvas.height = Math.round(cropH);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fill crisp off-white background
          ctx.fillStyle = '#FAF9F6';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw paths shifted by cropX & cropY
          paths.forEach((p) => {
            if (p.points.length === 0) return;
            ctx.beginPath();
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.strokeWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.moveTo(p.points[0].x - cropX, p.points[0].y - cropY);
            if (p.points.length === 1) {
              ctx.lineTo(p.points[0].x - cropX + 0.1, p.points[0].y - cropY + 0.1);
            } else {
              for (let i = 1; i < p.points.length; i++) {
                ctx.lineTo(p.points[i].x - cropX, p.points[i].y - cropY);
              }
            }
            ctx.stroke();
          });

          drawingDataUri = canvas.toDataURL('image/png');
        }
      } catch (err) {
        console.warn('HTML Canvas export failed:', err);
      }
    }

    // Fallback SVG if PNG canvas export didn't run or wasn't available
    if (!drawingDataUri) {
      let pathElements = '';
      paths.forEach((p) => {
        if (p.points.length === 0) return;
        let d = `M ${(p.points[0].x - cropX).toFixed(1)} ${(p.points[0].y - cropY).toFixed(1)}`;
        if (p.points.length === 1) {
          d += ` L ${(p.points[0].x - cropX + 0.1).toFixed(1)} ${(p.points[0].y - cropY + 0.1).toFixed(1)}`;
        } else {
          for (let i = 1; i < p.points.length; i++) {
            d += ` L ${(p.points[i].x - cropX).toFixed(1)} ${(p.points[i].y - cropY).toFixed(1)}`;
          }
        }
        pathElements += `<path d="${d}" stroke="${p.color}" stroke-width="${p.strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round" />`;
      });

      const svgWidth = Math.round(cropW);
      const svgHeight = Math.round(cropH);
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}"><rect width="100%" height="100%" fill="#FAF9F6"/>${pathElements}</svg>`;
      
      const encodeBase64 = (input: string) => {
        try {
          if (typeof btoa !== 'undefined') {
            return btoa(unescape(encodeURIComponent(input)));
          }
        } catch (e) {}
        return encodeURIComponent(input);
      };

      drawingDataUri = `data:image/svg+xml;base64,${encodeBase64(svgContent)}`;
    }

    onSaveDrawing(drawingDataUri);
    handleClear();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        {/* Header toolbar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>🎨 Canvas Drawing Sketch</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Drawing Canvas Area */}
        <View
          style={styles.canvasContainer}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            if (width > 0 && height > 0) {
              setContainerSize({ width, height });
            }
          }}
          {...panResponder.panHandlers}
        >
          {/* Render Saved Paths */}
          {paths.map((p) => (
            <View key={p.id} style={StyleSheet.absoluteFill} pointerEvents="none">
              {p.points.map((pt, idx) => {
                if (idx === 0) return null;
                const prev = p.points[idx - 1];
                const dx = pt.x - prev.x;
                const dy = pt.y - prev.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                return (
                  <View
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: prev.x,
                      top: prev.y,
                      width: length,
                      height: p.strokeWidth,
                      backgroundColor: p.color,
                      borderRadius: p.strokeWidth / 2,
                      transform: [
                        { translateX: 0 },
                        { translateY: -p.strokeWidth / 2 },
                        { rotate: `${angle}deg` },
                      ],
                    }}
                  />
                );
              })}
            </View>
          ))}

          {/* Render Active Path */}
          {currentPath.map((pt, idx) => {
            if (idx === 0) return null;
            const prev = currentPath[idx - 1];
            const dx = pt.x - prev.x;
            const dy = pt.y - prev.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            return (
              <View
                key={idx}
                style={{
                  position: 'absolute',
                  left: prev.x,
                  top: prev.y,
                  width: length,
                  height: selectedWidth,
                  backgroundColor: selectedColor,
                  borderRadius: selectedWidth / 2,
                  transform: [
                    { translateX: 0 },
                    { translateY: -selectedWidth / 2 },
                    { rotate: `${angle}deg` },
                  ],
                }}
              />
            );
          })}
        </View>

        {/* Drawing Controls */}
        <View style={styles.controlsBar}>
          <View style={styles.colorRow}>
            {STROKE_COLORS.map((col) => (
              <TouchableOpacity
                key={col}
                style={[
                  styles.colorCircle,
                  { backgroundColor: col },
                  selectedColor === col && styles.selectedColorCircle,
                ]}
                onPress={() => setSelectedColor(col)}
              />
            ))}
          </View>

          <View style={styles.widthRow}>
            {STROKE_WIDTHS.map((w) => (
              <TouchableOpacity
                key={w}
                style={[
                  styles.widthBtn,
                  selectedWidth === w && styles.selectedWidthBtn,
                ]}
                onPress={() => setSelectedWidth(w)}
              >
                <View
                  style={{
                    width: w * 2.5,
                    height: w * 2.5,
                    borderRadius: w * 1.25,
                    backgroundColor: selectedColor,
                  }}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  iconBtn: {
    padding: 6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearBtn: {
    padding: 6,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    margin: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  controlsBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  selectedColorCircle: {
    borderColor: COLORS.primary,
    borderWidth: 3,
    transform: [{ scale: 1.15 }],
  },
  widthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  widthBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  selectedWidthBtn: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
});
