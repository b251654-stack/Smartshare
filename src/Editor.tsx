import { useCallback, useState, useRef, useEffect, type MouseEvent as ReactMouseEvent } from 'react';
import './App.css';
import { readProjects, saveProject, type ProjectRecord } from './projects';
import { hasPremiumSubscription, saveCloudProject, trackProductEvent, uploadDesignAsset } from './supabase';

type ShapeKind = 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow';
type GradientDirection = 'horizontal' | 'vertical' | 'diagonal';

type DesignItem = {
  id: number;
  type: 'text' | 'shape' | 'image';
  textCurve?: number;
  rotation?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  visible?: boolean;
  shapeKind?: ShapeKind;
  x: number;
  y: number;
  text?: string;
  src?: string;
  width?: number;
  height?: number;
  color: string;
  fontSize: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  locked?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  fontFamily?: string;
  letterSpacing?: number;
  lineHeight?: number;
  textBackgroundEnabled?: boolean;
  textBackgroundColor?: string;
  textHighlightPadding?: number;
  textHighlightRadius?: number;
  textHighlightOpacity?: number;
  textOutlineEnabled?: boolean;
  textOutlineColor?: string;
  textShadowEnabled?: boolean;
textShadowColor?: string;
textShadowBlur?: number;
textShadowOffsetX?: number;
textShadowOffsetY?: number;
textGlowEnabled?: boolean;
textGlowColor?: string;
textGlowBlur?: number;

  fillType?: 'solid' | 'gradient';
  gradientColor2?: string;
  gradientColor3?: string;
  useThirdColor?: boolean;
  gradientDirection?: GradientDirection;

  opacity?: number;
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;

  borderEnabled?: boolean;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
};

type EditorProps = {
  projectId: string;
  userId?: string;
  onBack?: () => void;
  onUpgrade?: () => void;
};

type ExportQuality = 'normal' | 'medium' | 'hd';

type SavedProject = {
  items: DesignItem[];
  background: string;
  backgroundFillType: 'solid' | 'gradient';
  backgroundColor2: string;
  backgroundColor3: string;
  backgroundUseThirdColor: boolean;
  backgroundDirection: GradientDirection;
};

const categories = [
  'All', 'Instagram', 'YouTube', 'Wedding', 'Birthday',
  'Business', 'Presentation', 'Education', 'Logo',
  'Posters', 'Facebook', 'TikTok', 'LinkedIn', 'X',
  'Pinterest', 'Snapchat', 'WhatsApp', 'Threads', 'Reddit'
];

const templates = [
  { name: 'Instagram Post', category: 'Instagram', image: 'photo-1611162617474-5b21e879e113' },
  { name: 'Instagram Story', category: 'Instagram', image: 'photo-1611262588024-d12430b98920' },
  { name: 'Instagram Promotion', category: 'Instagram', image: 'photo-1611162616305-c69b3fa7fbe0' },
  { name: 'Facebook Post', category: 'Facebook', image: 'photo-1521737711867-e3b97375f902' },
  { name: 'Facebook Story', category: 'Facebook', image: 'photo-1511988617509-a57c8a288659' },
  { name: 'TikTok Video Cover', category: 'TikTok', image: 'photo-1492619375914-88005aa9e8fb' },
  { name: 'TikTok Story', category: 'TikTok', image: 'photo-1513364776144-60967b0f800f' },
  { name: 'YouTube Thumbnail', category: 'YouTube', image: 'photo-1611162616475-46b635cb6868' },
  { name: 'YouTube Banner', category: 'YouTube', image: 'photo-1611162618071-b39a2ec055fb' },
  { name: 'YouTube Shorts Cover', category: 'YouTube', image: 'photo-1611162616475-46b635cb6868' },
  { name: 'LinkedIn Post', category: 'LinkedIn', image: 'photo-1450101499163-c8848c66ca85' },
  { name: 'LinkedIn Banner', category: 'LinkedIn', image: 'photo-1497366754035-f200968a6e72' },
  { name: 'X Post', category: 'X', image: 'photo-1500534623283-312aade485b7' },
  { name: 'X Header', category: 'X', image: 'photo-1553877522-43269d4ea984' },
  { name: 'Pinterest Pin', category: 'Pinterest', image: 'photo-1483985988355-763728e1935b' },
  { name: 'Pinterest Idea Pin', category: 'Pinterest', image: 'photo-1500530855697-b586d89ba3ee' },
  { name: 'Snapchat Story', category: 'Snapchat', image: 'photo-1530103862676-de8c9debad1d' },
  { name: 'WhatsApp Status', category: 'WhatsApp', image: 'photo-1519741497674-611481863552' },
  { name: 'WhatsApp Catalog', category: 'WhatsApp', image: 'photo-1523275335684-37898b6baf30' },
  { name: 'Threads Post', category: 'Threads', image: 'photo-1513364776144-60967b0f800f' },
  { name: 'Reddit Post', category: 'Reddit', image: 'photo-1552664730-d307ca884978' },
  { name: 'Wedding Invitation', category: 'Wedding', image: 'photo-1519741497674-611481863552' },
  { name: 'Wedding Card', category: 'Wedding', image: 'photo-1511285560929-80b456fea0bc' },
  { name: 'Birthday Invitation', category: 'Birthday', image: 'photo-1530103862676-de8c9debad1d' },
  { name: 'Birthday Poster', category: 'Birthday', image: 'photo-1464349153735-7db50ed83c84' },
  { name: 'Business Flyer', category: 'Business', image: 'photo-1497366754035-f200968a6e72' },
  { name: 'Business Card', category: 'Business', image: 'photo-1504270997636-07ddfbd48945' },
  { name: 'Presentation Cover', category: 'Presentation', image: 'photo-1454165804606-c3d57bc86b40' },
  { name: 'Education Poster', category: 'Education', image: 'photo-1503676260728-1c00da094a0b' },
  { name: 'Creative Logo', category: 'Logo', image: 'photo-1626785774573-4b799315345d' },
  { name: 'Event Poster', category: 'Posters', image: 'photo-1500530855697-b586d89ba3ee' },
  { name: 'Facebook Cover', category: 'Facebook', image: 'photo-1611162616305-c69b3fa7fbe0' }
];

const quickColors = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316',
  '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
  '#10B981', '#06B6D4', '#0EA5E9', '#3B82F6',
  '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E', '#78350F', '#64748B',
  '#94A3B8', '#A3A3A3', '#FCA5A5', '#C4B5FD'
];

type DragInfo = {
  id: number;
  startX: number;
  startY: number;
  itemX: number;
  itemY: number;
};

type ResizeInfo = {
  id: number;
  handle: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
};

function hslToHex(h: number, s: number, l: number) {
  const saturation = s / 100;
  const lightness = l / 100;
  const a = saturation * Math.min(lightness, 1 - lightness);

  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lightness - a * Math.max(
      -1,
      Math.min(k - 3, 9 - k, 1)
    );

    return Math.round(255 * color).toString(16).padStart(2, '0');
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}

function getGradientCoordinates(direction: GradientDirection) {
  if (direction === 'vertical') {
    return { x1: '0%', y1: '0%', x2: '0%', y2: '100%' };
  }

  if (direction === 'diagonal') {
    return { x1: '0%', y1: '0%', x2: '100%', y2: '100%' };
  }

  return { x1: '0%', y1: '0%', x2: '100%', y2: '0%' };
}

export default function Editor({ projectId, userId, onBack, onUpgrade }: EditorProps) {
  const [savedProject] = useState<ProjectRecord<SavedProject> | undefined>(
    () => readProjects<SavedProject>(userId).find(item => item.id === projectId)
  );
  const [projectName, setProjectName] = useState(savedProject?.name ?? 'Untitled design');
  const [activeTool, setActiveTool] = useState('Templates');
  const [items, setItems] = useState<DesignItem[]>(() => savedProject?.design.items ?? []);
  const [selected, setSelected] = useState<number | null>(null);
  const [background, setBackground] = useState(() => savedProject?.design.background ?? '#ffffff');
  const [backgroundFillType, setBackgroundFillType] = useState<'solid' | 'gradient'>(
    () => savedProject?.design.backgroundFillType ?? 'solid'
  );
  const [backgroundColor2, setBackgroundColor2] = useState(() => savedProject?.design.backgroundColor2 ?? '#8b5cf6');
  const [backgroundColor3, setBackgroundColor3] = useState(() => savedProject?.design.backgroundColor3 ?? '#ec4899');
  const [backgroundUseThirdColor, setBackgroundUseThirdColor] = useState(
    () => savedProject?.design.backgroundUseThirdColor ?? false
  );
  const [backgroundDirection, setBackgroundDirection] = useState<GradientDirection>(
    () => savedProject?.design.backgroundDirection ?? 'horizontal'
  );
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [premiumStatus, setPremiumStatus] = useState<'checking' | 'free' | 'premium' | 'error'>(
    userId ? 'checking' : 'free'
  );

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const [history, setHistory] = useState<DesignItem[][]>(
    () => [savedProject?.design.items ?? []]
  );
  const [historyIndex, setHistoryIndex] = useState(0);

  const [colorHue, setColorHue] = useState(260);

  useEffect(() => {
    if (!userId) {
      setPremiumStatus('free');
      return;
    }

    let active = true;
    setPremiumStatus('checking');
    void hasPremiumSubscription(userId)
      .then(isPremium => {
        if (active) setPremiumStatus(isPremium ? 'premium' : 'free');
      })
      .catch(error => {
        console.error('Could not verify the Premium subscription.', error);
        if (active) {
          setPremiumStatus('error');
          setExportError('Could not verify Premium status. Try again before exporting HD.');
        }
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const historyRef = useRef<DesignItem[][]>([savedProject?.design.items ?? []]);
  const historyIndexRef = useRef(0);
  const latestItemsRef = useRef<DesignItem[]>(savedProject?.design.items ?? []);
  const dragRef = useRef<DragInfo | null>(null);
  const resizeRef = useRef<ResizeInfo | null>(null);
  const sidePanelRef = useRef<HTMLElement>(null);
  const changedRef = useRef(false);
  const clipboardRef = useRef<DesignItem | null>(null);
  const cloudSaveSequenceRef = useRef(0);
  const nextIdRef = useRef(
    Math.max(0, ...(savedProject?.design.items ?? []).map(item => item.id)) + 1
  );

  useEffect(() => {
    if (activeTool === 'Adjust') {
      sidePanelRef.current?.scrollTo({ top: 0 });
    }
  }, [activeTool, selected]);

  const saveCurrentProject = useCallback(() => {
    const design: SavedProject = {
      items,
      background,
      backgroundFillType,
      backgroundColor2,
      backgroundColor3,
      backgroundUseThirdColor,
      backgroundDirection
    };

    try {
      const projectToSave: ProjectRecord<SavedProject> = {
        id: projectId,
        name: projectName.trim() || 'Untitled design',
        createdAt: savedProject?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        design
      };
      saveProject(projectToSave, userId);

      if (!userId) {
        setSaveStatus('Saved locally');
        return;
      }

      cloudSaveSequenceRef.current += 1;
      const saveSequence = cloudSaveSequenceRef.current;
      setSaveStatus('Syncing…');
      void saveCloudProject(userId, projectToSave)
        .then(() => {
          if (cloudSaveSequenceRef.current === saveSequence) {
            setSaveStatus('Saved to cloud');
          }
        })
        .catch(error => {
          console.error('Could not sync project to cloud.', error);
          if (cloudSaveSequenceRef.current === saveSequence) {
            setSaveStatus('Cloud sync failed');
          }
        });
    } catch (error) {
      console.error('Could not save project.', error);
      setSaveStatus('Save failed');
    }
  }, [
    items,
    background,
    backgroundFillType,
    backgroundColor2,
    backgroundColor3,
    backgroundUseThirdColor,
    backgroundDirection,
    projectId,
    userId,
    projectName,
    savedProject?.createdAt
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(saveCurrentProject, 350);
    return () => window.clearTimeout(timeoutId);
  }, [saveCurrentProject]);

  const handleBack = () => {
    saveCurrentProject();
    onBack?.();
  };

  const getNextId = () => {
    const id = nextIdRef.current;
    nextIdRef.current += 1;
    return id;
  };

  const current = items.find(item => item.id === selected);

  const saveHistory = (next: DesignItem[]) => {
    setSaveStatus('Saving...');
    const copy = next.map(item => ({ ...item }));
    const trimmed = historyRef.current.slice(0, historyIndexRef.current + 1);
    trimmed.push(copy);

    historyRef.current = trimmed;
    historyIndexRef.current = trimmed.length - 1;
    latestItemsRef.current = next;

    setHistory(trimmed);
    setHistoryIndex(trimmed.length - 1);
  };

  const commitItems = (next: DesignItem[]) => {
    latestItemsRef.current = next;
    saveHistory(next);
    setItems(next);
  };

  useEffect(() => {
    const handleCopyPaste = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      const isShortcut = e.ctrlKey || e.metaKey;
      if (!isShortcut) return;

      if (e.key.toLowerCase() === 'c' && selected !== null) {
        const item = latestItemsRef.current.find(value => value.id === selected);
        if (!item) return;

        e.preventDefault();
        clipboardRef.current = { ...item };
      }

      if (e.key.toLowerCase() === 'v' && clipboardRef.current) {
        e.preventDefault();
        const id = nextIdRef.current;
        nextIdRef.current += 1;
        const copy: DesignItem = {
          ...clipboardRef.current,
          id,
          x: clipboardRef.current.x + 30,
          y: clipboardRef.current.y + 30,
          locked: false
        };

        const next = [...latestItemsRef.current, copy];
        latestItemsRef.current = next;
        const copyHistory = next.map(item => ({ ...item }));
        const trimmed = historyRef.current.slice(0, historyIndexRef.current + 1);
        trimmed.push(copyHistory);
        historyRef.current = trimmed;
        historyIndexRef.current = trimmed.length - 1;
        setHistory(trimmed);
        setHistoryIndex(trimmed.length - 1);
        setItems(next);
        clipboardRef.current = { ...copy };
        setSelected(id);
      }
    };

    window.addEventListener('keydown', handleCopyPaste);
    return () => window.removeEventListener('keydown', handleCopyPaste);
  }, [selected]);

  const undo = () => {
    if (historyIndexRef.current <= 0) return;

    const index = historyIndexRef.current - 1;
    historyIndexRef.current = index;

    const previous = historyRef.current[index].map(item => ({ ...item }));

    latestItemsRef.current = previous;
    setHistoryIndex(index);
    setItems(previous);
  };

  const redo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;

    const index = historyIndexRef.current + 1;
    historyIndexRef.current = index;

    const next = historyRef.current[index].map(item => ({ ...item }));

    latestItemsRef.current = next;
    setHistoryIndex(index);
    setItems(next);
  };

  const updateItem = (changes: Partial<DesignItem>) => {
    if (selected === null || current?.locked) return;

    commitItems(items.map(item =>
      item.id === selected ? { ...item, ...changes } : item
    ));
  };
  const alignSelectedItem = (position: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
  if (!current || current.locked) return;

  const itemWidth = current.width ?? 0;
  const itemHeight = current.height ?? current.fontSize;

  switch (position) {
    case 'left':
      updateItem({ x: 0 });
      break;
    case 'center':
      updateItem({ x: (800 - itemWidth) / 2 });
      break;
    case 'right':
      updateItem({ x: 800 - itemWidth });
      break;
    case 'top':
      updateItem({ y: 0 });
      break;
    case 'middle':
      updateItem({ y: (500 - itemHeight) / 2 });
      break;
    case 'bottom':
      updateItem({ y: 500 - itemHeight });
      break;
  }
};

  const applyColor = (color: string) => {
    if (!current || current.locked) return;
    updateItem({ color });
  };

  const applySpectrumColor = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!current || current.locked) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const saturation = x * 100;
    const lightness = 50 * (1 - y);

    applyColor(hslToHex(colorHue, saturation, lightness));
  };

  const addText = (
    type: 'heading' | 'subheading' | 'body' | 'normal' = 'normal'
  ) => {
    const presets = {
      heading: { text: 'Add a Heading', fontSize: 48, bold: true },
      subheading: { text: 'Add a Subheading', fontSize: 30, bold: true },
      body: { text: 'Add your body text here', fontSize: 20, bold: false },
      normal: { text: 'Your Text Here', fontSize: 36, bold: false }
    };

    const preset = presets[type];
    const id = getNextId();

    commitItems([...latestItemsRef.current, {
      id,
      type: 'text',
      x: 400,
      y: 250,
      text: preset.text,
      color: '#222222',
      fontSize: preset.fontSize,
      bold: preset.bold
    }]);

    setSelected(id);
    setActiveTool('Text');
  };

  const addShape = (shapeKind: ShapeKind) => {
    const id = getNextId();

    const dimensions: Record<ShapeKind, { width: number; height: number }> = {
      rectangle: { width: 180, height: 120 },
      circle: { width: 130, height: 130 },
      triangle: { width: 150, height: 130 },
      line: { width: 180, height: 5 },
      arrow: { width: 180, height: 60 }
    };

    const size = dimensions[shapeKind];

    commitItems([...latestItemsRef.current, {
      id,
      type: 'shape',
      shapeKind,
      x: 300,
      y: 180,
      width: size.width,
      height: size.height,
      color: '#8b5cf6',
      fontSize: 120,
      fillType: 'solid',
      gradientColor2: '#ec4899',
      gradientColor3: '#f59e0b',
      useThirdColor: false,
      gradientDirection: 'horizontal'
    }]);

    setSelected(id);
    setActiveTool('Elements');
  };

  const openTemplate = (template: typeof templates[number]) => {
    const id = getNextId();

    commitItems([
      {
        id,
        type: 'text',
        x: 400,
        y: 190,
        text: template.name,
        color: '#222222',
        fontSize: 42,
        bold: true
      },
      {
        id: id + 1,
        type: 'text',
        x: 400,
        y: 260,
        text: 'Customize your design',
        color: '#7546dc',
        fontSize: 24
      }
    ]);

    setSelected(id);
    setActiveTool('Text');
  };

  const uploadImage = (file?: File) => {
    if (!file) return;

    if (userId) {
      void uploadDesignAsset(userId, file)
        .then(src => {
          const id = getNextId();
          const next = [...latestItemsRef.current, {
            id,
            type: 'image' as const,
            src,
            x: 100,
            y: 80,
            width: 300,
            height: 200,
            color: '#ffffff',
            fontSize: 24
          }];
          commitItems(next);
          setSelected(id);
          void trackProductEvent(userId, 'design_asset_uploaded', { size: file.size });
        })
        .catch(error => {
          console.error('Could not upload image to cloud storage.', error);
          setExportError('Cloud upload failed. The local copy could not be added.');
        });
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const id = getNextId();

      const next = [...latestItemsRef.current, {
        id,
        type: 'image' as const,
        src: reader.result as string,
        x: 100,
        y: 80,
        width: 300,
        height: 200,
        color: '#ffffff',
        fontSize: 24
      }];

      commitItems(next);
      setSelected(id);
    };

    reader.readAsDataURL(file);
  };

  const duplicateItem = () => {
    if (!current) return;

    const id = getNextId();

    const copy = {
      ...current,
      id,
      x: current.x + 30,
      y: current.y + 30,
      locked: false
    };

    commitItems([...latestItemsRef.current, copy]);
    setSelected(id);
  };

  const deleteItem = () => {
    if (!current || current.locked) return;

    commitItems(latestItemsRef.current.filter(item => item.id !== selected));
    setSelected(null);
  };

  const toggleLock = () => {
    if (!current) return;

    commitItems(latestItemsRef.current.map(item =>
      item.id === selected
        ? { ...item, locked: !item.locked }
        : item
    ));
  };

  const changeSize = (amount: number) => {
    if (!current || current.locked) return;

    commitItems(latestItemsRef.current.map(item => {
      if (item.id !== selected) return item;

      if (item.type === 'image' || item.type === 'shape') {
        return {
          ...item,
          width: Math.max(10, (item.width ?? 150) + amount),
          height: Math.max(10, (item.height ?? 100) + amount)
        };
      }

      return {
        ...item,
        fontSize: Math.max(8, item.fontSize + amount)
      };
    }));
  };

  const moveLayer = (direction: number) => {
    if (selected === null) return;

    const next = [...latestItemsRef.current];
    const index = next.findIndex(item => item.id === selected);
    const target = index + direction;

    if (index < 0 || target < 0 || target >= next.length) return;

    [next[index], next[target]] = [next[target], next[index]];
    commitItems(next);
  };

  const toggleItemVisibility = (id: number) => {
    const next = latestItemsRef.current.map(item =>
      item.id === id ? { ...item, visible: item.visible === false } : item
    );
    commitItems(next);
  };

  const moveLayerById = (id: number, direction: number) => {
    const next = [...latestItemsRef.current];
    const index = next.findIndex(item => item.id === id);
    const target = index + direction;

    if (index < 0 || target < 0 || target >= next.length) return;

    [next[index], next[target]] = [next[target], next[index]];
    commitItems(next);
  };

  const toggleLayerLock = (id: number) => {
    const next = latestItemsRef.current.map(item =>
      item.id === id ? { ...item, locked: !item.locked } : item
    );
    commitItems(next);
  };

  const getLayerName = (item: DesignItem) => {
    if (item.type === 'text') {
      const content = (item.text ?? '').trim();
      return content ? content.slice(0, 24) : 'Text';
    }
    if (item.type === 'image') return 'Image';
    return `${item.shapeKind ?? 'Shape'} Shape`;
  };

  const startDrag = (e: ReactMouseEvent<SVGGElement>, item: DesignItem) => {
    if (item.locked) return;

    e.preventDefault();
    e.stopPropagation();

    setSelected(item.id);
    changedRef.current = false;

    dragRef.current = {
      id: item.id,
      startX: e.clientX,
      startY: e.clientY,
      itemX: item.x,
      itemY: item.y
    };
  };

  const startResize = (
    e: ReactMouseEvent<SVGCircleElement>,
    item: DesignItem,
    handle: string
  ) => {
    if (item.locked) return;

    e.preventDefault();
    e.stopPropagation();

    setSelected(item.id);
    changedRef.current = false;

    resizeRef.current = {
      id: item.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      x: item.x,
      y: item.y,
      width: item.width ?? (item.type === 'shape' ? 180 : 300),
      height: item.height ?? (item.type === 'shape' ? 120 : 200),
      fontSize: item.fontSize
    };
  };

  const moveDrag = (e: ReactMouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const reference = resizeRef.current ?? dragRef.current;
    if (!reference) return;

    const dx = (e.clientX - reference.startX) * (800 / rect.width);
    const dy = (e.clientY - reference.startY) * (500 / rect.height);

    if (resizeRef.current) {
      const r = resizeRef.current;
      const sx = r.handle.includes('w') ? -1 : r.handle.includes('e') ? 1 : 0;
      const sy = r.handle.includes('n') ? -1 : r.handle.includes('s') ? 1 : 0;

      const item = latestItemsRef.current.find(value => value.id === r.id);
      if (!item) return;

      let updated: DesignItem;

      if (item.type === 'image' || item.type === 'shape') {
        const width = Math.max(10, r.width + dx * sx);
        const height = Math.max(10, r.height + dy * sy);

        updated = {
          ...item,
          width,
          height,
          x: r.x + (sx < 0 ? r.width - width : 0),
          y: r.y + (sy < 0 ? r.height - height : 0)
        };
      } else {
        const sizeDelta = Math.abs(dx) > Math.abs(dy)
          ? dx * (sx || 1)
          : dy * (sy || 1);

        updated = {
          ...item,
          fontSize: Math.max(8, r.fontSize + sizeDelta * 0.25)
        };
      }

      const next = latestItemsRef.current.map(value =>
        value.id === r.id ? updated : value
      );

      latestItemsRef.current = next;
      setItems(next);
      changedRef.current = true;
      return;
    }

    if (dragRef.current) {
      const d = dragRef.current;

      const next = latestItemsRef.current.map(item =>
        item.id === d.id
          ? { ...item, x: d.itemX + dx, y: d.itemY + dy }
          : item
      );

      latestItemsRef.current = next;
      setItems(next);
      changedRef.current = true;
    }
  };

  const stopDrag = () => {
    if (changedRef.current) saveHistory(latestItemsRef.current);

    dragRef.current = null;
    resizeRef.current = null;
    changedRef.current = false;
  };

  const getExportFileName = (extension: 'svg' | 'png' | 'jpg') => {
    const fileName = projectName.trim().replace(/[<>:"/\\|?*]+/g, '-');
    return `${fileName || 'SmartShare-Design'}.${extension}`;
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadSvg = () => {
    if (premiumStatus !== 'premium') {
      setExportError(premiumStatus === 'checking'
        ? 'Checking your Premium status. Try again in a moment.'
        : 'SVG is a Premium export. Upgrade to Premium to download it.');
      return;
    }

    const svg = document.getElementById('ss-canvas');
    if (!(svg instanceof SVGSVGElement)) {
      setExportError('Could not find the design canvas to export.');
      return;
    }

    try {
      const data = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
      downloadBlob(blob, getExportFileName('svg'));
      setExportError(null);
      setDownloadMenuOpen(false);
    } catch (error) {
      console.error('Could not export SVG.', error);
      setExportError('SVG export failed. Please try again.');
    }
  };

  const downloadRaster = async (format: 'png' | 'jpg', quality: ExportQuality) => {
    if (quality === 'hd' && premiumStatus !== 'premium') {
      setExportError(premiumStatus === 'checking'
        ? 'Checking your Premium status. Try again in a moment.'
        : 'HD downloads are Premium-only. Upgrade to Premium to unlock HD quality.');
      return;
    }

    const svg = document.getElementById('ss-canvas');
    if (!(svg instanceof SVGSVGElement)) {
      setExportError('Could not find the design canvas to export.');
      return;
    }

    setExportError(null);
    const scale = quality === 'normal' ? 1 : quality === 'medium' ? 2 : 4;
    const width = 800 * scale;
    const height = 500 * scale;
    const exportSvg = svg.cloneNode(true) as SVGSVGElement;
    exportSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    exportSvg.setAttribute('width', String(width));
    exportSvg.setAttribute('height', String(height));
    const svgBlob = new Blob(
      [new XMLSerializer().serializeToString(exportSvg)],
      { type: 'image/svg+xml;charset=utf-8' }
    );
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('The design preview could not be rendered.'));
        image.src = svgUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas rendering is unavailable.');

      if (format === 'jpg') {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          result => result
            ? resolve(result)
            : reject(new Error('The image file could not be created.')),
          mimeType,
          0.92
        );
      });

      downloadBlob(blob, getExportFileName(format));
      setDownloadMenuOpen(false);
    } catch (error) {
      console.error(`Could not export ${format.toUpperCase()}.`, error);
      setExportError(`${format.toUpperCase()} export failed. Please try again.`);
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  };

  const openPremiumPlans = () => {
    try {
      const design: SavedProject = {
        items,
        background,
        backgroundFillType,
        backgroundColor2,
        backgroundColor3,
        backgroundUseThirdColor,
        backgroundDirection
      };
      saveProject({
        id: projectId,
        name: projectName.trim() || 'Untitled design',
        createdAt: savedProject?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        design
      }, userId);
      if (userId) {
        void saveCloudProject(userId, {
          id: projectId,
          name: projectName.trim() || 'Untitled design',
          createdAt: savedProject?.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          design
        }).catch(error => console.error('Could not save project before opening Premium plans.', error));
      }
      onUpgrade?.();
    } catch (error) {
      console.error('Could not save project before opening Premium plans.', error);
      setExportError('Could not save your design. Please try again before upgrading.');
    }
  };

  const filteredTemplates = templates.filter(template =>
    (category === 'All' || template.category === category) &&
    template.name.toLowerCase().includes(search.toLowerCase())
  );

  const tools = [
    { name: 'Templates', icon: '▦' },
    { name: 'Elements', icon: '◇' },
    { name: 'Text', icon: 'T' },
    { name: 'Adjust', icon: '↻' },
    { name: 'Uploads', icon: '↑' },
    { name: 'Background', icon: '◐' },
    { name: 'Layers', icon: '▤' }
  ];

  return (
    <div className="ss-editor">
      <header className="ss-topbar">
        <div className="ss-brand">Smart<span>Share</span></div>
        <input
          className="ss-project-name"
          aria-label="Project name"
          value={projectName}
          maxLength={80}
          onChange={event => {
            setProjectName(event.target.value);
            setSaveStatus('Saving...');
          }}
        />

        <div className="ss-top-actions">
          <span className="ss-save-status" aria-live="polite">{saveStatus}</span>
          <button onClick={handleBack}>← Back</button>
          <button onClick={undo} disabled={historyIndex === 0} title="Undo">↶</button>
          <button onClick={redo} disabled={historyIndex === history.length - 1} title="Redo">↷</button>
          <div className="ss-export-menu-container">
            <button
              className="ss-download"
              type="button"
              aria-haspopup="menu"
              aria-expanded={downloadMenuOpen}
              onClick={() => {
                setDownloadMenuOpen(open => !open);
                setExportError(null);
              }}
            >
              ↓ Download
            </button>
            {downloadMenuOpen && (
              <div className="ss-export-menu" role="menu" aria-label="Export design">
                <div className="ss-export-quality-label">PNG</div>
                <button type="button" role="menuitem" onClick={() => void downloadRaster('png', 'normal')}>Normal · 800 × 500 · Free</button>
                <button type="button" role="menuitem" onClick={() => void downloadRaster('png', 'medium')}>Medium · 1600 × 1000 · Free</button>
                <button type="button" role="menuitem" onClick={() => void downloadRaster('png', 'hd')}>HD · 3200 × 2000 · Premium</button>
                <div className="ss-export-quality-label">JPG</div>
                <button type="button" role="menuitem" onClick={() => void downloadRaster('jpg', 'normal')}>Normal · 800 × 500 · Free</button>
                <button type="button" role="menuitem" onClick={() => void downloadRaster('jpg', 'medium')}>Medium · 1600 × 1000 · Free</button>
                <button type="button" role="menuitem" onClick={() => void downloadRaster('jpg', 'hd')}>HD · 3200 × 2000 · Premium</button>
                <button type="button" role="menuitem" onClick={downloadSvg}>SVG · Vector · Premium</button>
                {exportError && <p role="alert">{exportError}</p>}
                {premiumStatus !== 'premium' && (
                  <button type="button" role="menuitem" onClick={openPremiumPlans}>Explore Premium ↗</button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="ss-editor-body">
        <aside className="ss-tool-rail">
          {tools.map(tool => (
            <button
              key={tool.name}
              className={activeTool === tool.name ? 'ss-tool-active' : ''}
              onClick={() => setActiveTool(tool.name)}
              title={tool.name}
            >
              <span>{tool.icon}</span>
              <small>{tool.name}</small>
            </button>
          ))}
        </aside>

        <aside className="ss-side-panel" ref={sidePanelRef}>
          <div className="ss-panel-heading">
            <h2>{activeTool}</h2>
          </div>

          {activeTool === 'Templates' && (
            <>
              <input
                className="ss-search"
                placeholder="Search templates..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />

              <div className="ss-panel-content">
                <div className="ss-category-list">
                  {categories.map(item => (
                    <button
                      key={item}
                      className={category === item ? 'active' : ''}
                      onClick={() => setCategory(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="ss-template-grid">
                  {filteredTemplates.map(template => (
                    <button
                      className="ss-template-card"
                      key={template.name}
                      onClick={() => openTemplate(template)}
                    >
                      <img
                        src={`https://images.unsplash.com/${template.image}?auto=format&fit=crop&w=300&q=80`}
                        alt={template.name}
                      />
                      <span>{template.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTool === 'Elements' && (
            <div className="ss-panel-content">
              <h3>Shapes and Elements</h3>

              <button className="ss-option" onClick={() => addShape('rectangle')}>▭ Add Rectangle</button>
              <button className="ss-option" onClick={() => addShape('circle')}>◯ Add Circle</button>
              <button className="ss-option" onClick={() => addShape('triangle')}>△ Add Triangle</button>
              <button className="ss-option" onClick={() => addShape('line')}>─ Add Line</button>
              <button className="ss-option" onClick={() => addShape('arrow')}>➜ Add Arrow</button>

              {current?.type === 'shape' && (
                <div className="ss-settings">
                  <h3>Edit Selected Shape</h3>

                  <label>Fill Style</label>
                  <div style={{ display: 'flex', gap: 8, margin: '8px 0 16px' }}>
                    <button
                      type="button"
                      className="ss-option"
                      style={{
                        flex: 1,
                        border: current.fillType !== 'gradient' ? '2px solid #7546dc' : undefined
                      }}
                      onClick={() => updateItem({ fillType: 'solid' })}
                    >
                      Solid Color
                    </button>
                    <button
                      type="button"
                      className="ss-option"
                      style={{
                        flex: 1,
                        border: current.fillType === 'gradient' ? '2px solid #7546dc' : undefined
                      }}
                      onClick={() => updateItem({ fillType: 'gradient' })}
                    >
                      Gradient
                    </button>
                  </div>

                  {current.fillType !== 'gradient' ? (
                    <>
                      <label style={{ display: 'block', marginBottom: 10 }}>Quick Colors</label>

                      <div
                        className="ss-color-grid"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(6, 1fr)',
                          gap: 8,
                          marginBottom: 20
                        }}
                      >
                        {quickColors.map(color => (
                          <button
                            key={color}
                            type="button"
                            style={{
                              background: color,
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              border: current.color.toLowerCase() === color.toLowerCase()
                                ? '3px solid #7546dc'
                                : '1px solid #d1d5db',
                              cursor: 'pointer',
                              boxShadow: color === '#FFFFFF' ? 'inset 0 0 0 1px #ddd' : 'none'
                            }}
                            onClick={() => applyColor(color)}
                            title={color}
                          />
                        ))}
                      </div>

                      <label style={{ display: 'block', marginBottom: 8 }}>Rainbow Color Picker</label>

                      <div
                        onMouseDown={applySpectrumColor}
                        onMouseMove={e => {
                          if (e.buttons === 1) applySpectrumColor(e);
                        }}
                        style={{
                          width: '100%',
                          height: 175,
                          borderRadius: 10,
                          cursor: 'crosshair',
                          background: `
                            linear-gradient(to top, #000000, transparent),
                            linear-gradient(to right, #ffffff, hsl(${colorHue}, 100%, 50%))
                          `,
                          border: '1px solid #d1d5db',
                          touchAction: 'none',
                          marginBottom: 12
                        }}
                        title="Click or drag to choose a color"
                      />

                      <label style={{ display: 'block', marginBottom: 5 }}>Color Range</label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={colorHue}
                        onChange={e => setColorHue(Number(e.target.value))}
                        style={{ width: '100%', height: 18, cursor: 'pointer', accentColor: '#7546dc' }}
                      />

                      <div style={{ marginTop: 16 }}>
                        <label style={{ display: 'block', marginBottom: 8 }}>Custom Color</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input
                            type="color"
                            value={current.color}
                            onChange={e => applyColor(e.target.value)}
                            style={{ width: 55, height: 42, padding: 2, cursor: 'pointer' }}
                          />
                          <input
                            type="text"
                            value={current.color}
                            onChange={e => {
                              const value = e.target.value;
                              if (/^#[0-9A-Fa-f]{6}$/.test(value)) applyColor(value);
                            }}
                            placeholder="#8B5CF6"
                            maxLength={7}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              height: 40,
                              padding: '0 10px',
                              border: '1px solid #d1d5db',
                              borderRadius: 7
                            }}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <label>Gradient Colors</label>

                      <div style={{ display: 'flex', gap: 12, margin: '10px 0 14px' }}>
                        <div style={{ flex: 1 }}>
                          <small>Color 1</small>
                          <input
                            type="color"
                            value={current.color}
                            onChange={e => updateItem({ color: e.target.value })}
                            style={{ width: '100%', height: 42, cursor: 'pointer' }}
                          />
                        </div>

                        <div style={{ flex: 1 }}>
                          <small>Color 2</small>
                          <input
                            type="color"
                            value={current.gradientColor2 ?? '#ec4899'}
                            onChange={e => updateItem({ gradientColor2: e.target.value })}
                            style={{ width: '100%', height: 42, cursor: 'pointer' }}
                          />
                        </div>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
                        <input
                          type="checkbox"
                          checked={current.useThirdColor ?? false}
                          onChange={e => updateItem({ useThirdColor: e.target.checked })}
                        />
                        Use Third Color
                      </label>

                      {current.useThirdColor && (
                        <div style={{ marginBottom: 14 }}>
                          <small>Color 3</small>
                          <input
                            type="color"
                            value={current.gradientColor3 ?? '#f59e0b'}
                            onChange={e => updateItem({ gradientColor3: e.target.value })}
                            style={{ width: '100%', height: 42, cursor: 'pointer' }}
                          />
                        </div>
                      )}

                      <label>Gradient Direction</label>
                      <select
                        value={current.gradientDirection ?? 'horizontal'}
                        onChange={e => updateItem({
                          gradientDirection: e.target.value as GradientDirection
                        })}
                        style={{
                          width: '100%',
                          padding: 10,
                          margin: '8px 0 14px',
                          border: '1px solid #d1d5db',
                          borderRadius: 7
                        }}
                      >
                        <option value="horizontal">Horizontal →</option>
                        <option value="vertical">Vertical ↓</option>
                        <option value="diagonal">Diagonal ↘</option>
                      </select>

                      <div
                        style={{
                          height: 45,
                          borderRadius: 8,
                          marginBottom: 10,
                          background: current.useThirdColor
                            ? `linear-gradient(${current.gradientDirection === 'vertical' ? 'to bottom' : current.gradientDirection === 'diagonal' ? 'to bottom right' : 'to right'}, ${current.color}, ${current.gradientColor2 ?? '#ec4899'}, ${current.gradientColor3 ?? '#f59e0b'})`
                            : `linear-gradient(${current.gradientDirection === 'vertical' ? 'to bottom' : current.gradientDirection === 'diagonal' ? 'to bottom right' : 'to right'}, ${current.color}, ${current.gradientColor2 ?? '#ec4899'})`
                        }}
                      />
                      <small>Gradient Preview</small>
                    </>
                  )}

                  <div style={{ marginTop: 25, borderTop: '1px solid #ddd', paddingTop: 18 }}>
                    <h3>Border & Outline</h3>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
                      <input
                        type="checkbox"
                        checked={current.borderEnabled ?? false}
                        onChange={e => updateItem({ borderEnabled: e.target.checked })}
                      />
                      Enable Border
                    </label>

                    {current.borderEnabled && (
                      <>
                        <label>Border Color</label>
                        <input
                          type="color"
                          value={current.borderColor ?? '#000000'}
                          onChange={e => updateItem({ borderColor: e.target.value })}
                          style={{ width: '100%', height: 40 }}
                        />

                        <label>Border Width: {current.borderWidth ?? 2}px</label>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={current.borderWidth ?? 2}
                          onChange={e => updateItem({ borderWidth: Number(e.target.value) })}
                          style={{ width: '100%' }}
                        />

                        <label>Border Style</label>
                        <select
                          value={current.borderStyle ?? 'solid'}
                          onChange={e => updateItem({
                            borderStyle: e.target.value as 'solid' | 'dashed' | 'dotted'
                          })}
                          style={{ width: '100%', padding: 10, marginTop: 8, borderRadius: 7 }}
                        >
                          <option value="solid">Solid</option>
                          <option value="dashed">Dashed</option>
                          <option value="dotted">Dotted</option>
                        </select>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTool === 'Text' && (
            <div className="ss-panel-content">
              <h3>Add Text</h3>

              <button className="ss-text-style" onClick={() => addText('heading')}>
                <strong style={{ fontSize: 23 }}>Add a Heading</strong>
              </button>

              <button className="ss-text-style" onClick={() => addText('subheading')}>
                <strong style={{ fontSize: 18 }}>Add a Subheading</strong>
              </button>

              <button className="ss-text-style" onClick={() => addText('body')}>
                <span style={{ fontSize: 14 }}>Add Body Text</span>
              </button>

              <button className="ss-action" onClick={() => addText('normal')}>＋ Add Text</button>
              {current && (
  <div style={{ marginBottom: 16 }}>
    <label>Position Alignment</label>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
      <button className="ss-action" onClick={() => alignSelectedItem('left')}>Left</button>
      <button className="ss-action" onClick={() => alignSelectedItem('center')}>Center</button>
      <button className="ss-action" onClick={() => alignSelectedItem('right')}>Right</button>
      <button className="ss-action" onClick={() => alignSelectedItem('top')}>Top</button>
      <button className="ss-action" onClick={() => alignSelectedItem('middle')}>Middle</button>
      <button className="ss-action" onClick={() => alignSelectedItem('bottom')}>Bottom</button>
    </div>
  </div>
)}
              {current?.type === 'text' && (
                <div className="ss-settings">
                  <h3>Edit Selected Text</h3>
                  <div style={{ marginBottom: 16 }}>
  <label>Position Alignment</label>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
    <button className="ss-action" onClick={() => alignSelectedItem('left')}>Left</button>
    <button className="ss-action" onClick={() => alignSelectedItem('center')}>Center</button>
    <button className="ss-action" onClick={() => alignSelectedItem('right')}>Right</button>
    <button className="ss-action" onClick={() => alignSelectedItem('top')}>Top</button>
    <button className="ss-action" onClick={() => alignSelectedItem('middle')}>Middle</button>
    <button className="ss-action" onClick={() => alignSelectedItem('bottom')}>Bottom</button>
  </div>
</div>

                  <label>Text Content</label>
                  <textarea
                    value={current.text ?? ''}
                    onChange={e => updateItem({ text: e.target.value })}
                    style={{ width: '100%', minHeight: 75, padding: 10 }}
                  />

                  <label>Font Size</label>
                  <input
                    type="number"
                    min="8"
                    max="150"
                    value={current.fontSize}
                    onChange={e => updateItem({ fontSize: Number(e.target.value) })}
                  />

                  <label>Text Color</label>
                  <input
                    type="color"
                    value={current.color}
                    onChange={e => updateItem({ color: e.target.value })}
                  />

                  <label>Font Family</label>
                  <select
                    value={current.fontFamily ?? 'Arial'}
                    onChange={e => updateItem({ fontFamily: e.target.value })}
                  >
                    <option value="Arial">Arial</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Trebuchet MS">Trebuchet MS</option>
                    <option value="Impact">Impact</option>
                    <option value="Tahoma">Tahoma</option>
                    <option value="Garamond">Garamond</option>
                    <option value="Palatino Linotype">Palatino Linotype</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
                    <option value="Lucida Sans">Lucida Sans</option>
                    <option value="Brush Script MT">Brush Script MT</option>
                    <option value="Monospace">Monospace</option>
                    <option value="Cursive">Cursive</option>
                    <option value="Fantasy">Fantasy</option>
                  </select>

                  <label>Letter Spacing: {current.letterSpacing ?? 0}px</label>
                  <input
                    type="range"
                    min="-2"
                    max="20"
                    step="1"
                    value={current.letterSpacing ?? 0}
                    onChange={e =>
                      updateItem({ letterSpacing: Number(e.target.value) })
                    }
                  />

                  <label>Line Height: {current.lineHeight ?? 1.2}</label>
                  <input
                    type="range"
                    min="0.8"
                    max="3"
                    step="0.1"
                    value={current.lineHeight ?? 1.2}
                    onChange={e =>
                      updateItem({ lineHeight: Number(e.target.value) })
                    }
                  />

                  <label>Text Background</label>
                  <label>
                    <input
                      type="checkbox"
                      checked={current.textBackgroundEnabled ?? false}
                      onChange={e =>
                        updateItem({ textBackgroundEnabled: e.target.checked })
                      }
                    />
                    Enable Text Background
                  </label>

                  {current.textBackgroundEnabled && (
                    <>
                      <label>Background Color</label>
                      <input
                        type="color"
                        value={current.textBackgroundColor ?? '#ffff00'}
                        onChange={e =>
                          updateItem({ textBackgroundColor: e.target.value })
                        }
                      />

                      <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #ddd' }}>
                        <h3>Highlight Effects</h3>

                        <label>
                          Highlight Padding: {current.textHighlightPadding ?? 6}px
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          value={current.textHighlightPadding ?? 6}
                          onChange={e =>
                            updateItem({ textHighlightPadding: Number(e.target.value) })
                          }
                          style={{ width: '100%' }}
                        />

                        <label>
                          Rounded Corners: {current.textHighlightRadius ?? 5}px
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          value={current.textHighlightRadius ?? 5}
                          onChange={e =>
                            updateItem({ textHighlightRadius: Number(e.target.value) })
                          }
                          style={{ width: '100%' }}
                        />

                        <label>
                          Highlight Opacity: {current.textHighlightOpacity ?? 100}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={current.textHighlightOpacity ?? 100}
                          onChange={e =>
                            updateItem({ textHighlightOpacity: Number(e.target.value) })
                          }
                          style={{ width: '100%' }}
                        />
                      </div>
                    </>
                  )}

                  <label>Text Outline</label>
                  <label>
                    <input
                      type="checkbox"
                      checked={current.textOutlineEnabled ?? false}
                      onChange={e =>
                        updateItem({ textOutlineEnabled: e.target.checked })
                      }
                    />
                    Enable Text Outline
                  </label>

                  {current.textOutlineEnabled && (
                    <>
                      <label>Outline Color</label>
                      <input
                        type="color"
                        value={current.textOutlineColor ?? '#000000'}
                        onChange={e =>
                          updateItem({ textOutlineColor: e.target.value })
                        }
                      />
                    </>
                  )}

                  <div style={{ marginTop: 18, paddingTop: 15, borderTop: '1px solid #ddd' }}>
  <h3>Text Shadow</h3>

  <label>
    <input
      type="checkbox"
      checked={current.textShadowEnabled ?? false}
      onChange={e => updateItem({ textShadowEnabled: e.target.checked })}
    />
    Enable Text Shadow
  </label>

  {current.textShadowEnabled && (
    <>
      <label>Shadow Color</label>
      <input
        type="color"
        value={current.textShadowColor ?? '#000000'}
        onChange={e => updateItem({ textShadowColor: e.target.value })}
      />

      <label>Shadow Blur: {current.textShadowBlur ?? 6}px</label>
      <input
        type="range"
        min="0"
        max="30"
        value={current.textShadowBlur ?? 6}
        onChange={e => updateItem({ textShadowBlur: Number(e.target.value) })}
      />

      <label>Horizontal Offset: {current.textShadowOffsetX ?? 4}px</label>
      <input
        type="range"
        min="-30"
        max="30"
        value={current.textShadowOffsetX ?? 4}
        onChange={e => updateItem({ textShadowOffsetX: Number(e.target.value) })}
      />

      <label>Vertical Offset: {current.textShadowOffsetY ?? 4}px</label>
      <input
        type="range"
        min="-30"
        max="30"
        value={current.textShadowOffsetY ?? 4}
        onChange={e => updateItem({ textShadowOffsetY: Number(e.target.value) })}
      />
    </>
  )}
</div>

<div style={{ marginTop: 18, paddingTop: 15, borderTop: '1px solid #ddd' }}>
  <h3>Text Glow</h3>

  <label>
    <input
      type="checkbox"
      checked={current.textGlowEnabled ?? false}
      onChange={e => updateItem({ textGlowEnabled: e.target.checked })}
    />
    Enable Text Glow
  </label>

  {current.textGlowEnabled && (
    <>
      <label>Glow Color</label>
      <input
        type="color"
        value={current.textGlowColor ?? '#8b5cf6'}
        onChange={e => updateItem({ textGlowColor: e.target.value })}
      />

      <label>Glow Blur: {current.textGlowBlur ?? 12}px</label>
      <input
        type="range"
        min="1"
        max="40"
        value={current.textGlowBlur ?? 12}
        onChange={e => updateItem({ textGlowBlur: Number(e.target.value) })}
      />
    </>
  )}
</div>

                  <div style={{ marginTop: 18, paddingTop: 15, borderTop: '1px solid #ddd' }}>
                    <h3>Curved Text</h3>
                    <label>Curve: {current.textCurve ?? 0}</label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={current.textCurve ?? 0}
                      onChange={e => updateItem({ textCurve: Number(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                    <small>Negative = curve down, Positive = curve up, 0 = straight</small>
                  </div>

                  <div style={{ marginTop: 18, paddingTop: 15, borderTop: '1px solid #ddd' }}>
                    <h3>Curved Text</h3>
                    <label>Curve: {current.textCurve ?? 0}</label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={current.textCurve ?? 0}
                      onChange={e => updateItem({ textCurve: Number(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                    <small>Negative = curve down, Positive = curve up, 0 = straight</small>
                  </div>

                  <label>Text Alignment</label>

                  <div className="ss-format-row">
                    <button
                      className={current.textAlign === 'left' ? 'selected' : ''}
                      onClick={() => updateItem({ textAlign: 'left' })}
                      title="Align Left"
                    >
                      Left
                    </button>

                    <button
                      className={!current.textAlign || current.textAlign === 'center' ? 'selected' : ''}
                      onClick={() => updateItem({ textAlign: 'center' })}
                      title="Align Center"
                    >
                      Center
                    </button>

                    <button
                      className={current.textAlign === 'right' ? 'selected' : ''}
                      onClick={() => updateItem({ textAlign: 'right' })}
                      title="Align Right"
                    >
                      Right
                    </button>
                  </div>

                  <div className="ss-format-row">
                    <button
                      className={current.bold ? 'selected' : ''}
                      onClick={() => updateItem({ bold: !current.bold })}
                    >B</button>
                    <button
                      className={current.italic ? 'selected' : ''}
                      onClick={() => updateItem({ italic: !current.italic })}
                    >I</button>
                    <button
                      className={current.underline ? 'selected' : ''}
                      onClick={() => updateItem({ underline: !current.underline })}
                    >U</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTool === 'Uploads' && (
            <div className="ss-panel-content">
              <h3>Your Uploads</h3>
              <label className="ss-upload-button">
                ↑ Upload Image
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={e => {
                    uploadImage(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          )}

          {activeTool === 'Background' && (
            <div className="ss-panel-content">
              <h3>Background Settings</h3>

              <div className="ss-settings">
                <label>Background Style</label>

                <div style={{ display: 'flex', gap: 8, margin: '8px 0 18px' }}>
                  <button
                    className="ss-option"
                    style={{
                      flex: 1,
                      border: backgroundFillType === 'solid' ? '2px solid #7546dc' : undefined
                    }}
                    onClick={() => setBackgroundFillType('solid')}
                  >
                    Solid Color
                  </button>
                  <button
                    className="ss-option"
                    style={{
                      flex: 1,
                      border: backgroundFillType === 'gradient' ? '2px solid #7546dc' : undefined
                    }}
                    onClick={() => setBackgroundFillType('gradient')}
                  >
                    Gradient
                  </button>
                </div>

                {backgroundFillType === 'solid' ? (
                  <>
                    <label>Choose Color</label>
                    <input
                      type="color"
                      value={background}
                      onChange={e => setBackground(e.target.value)}
                    />

                    <div className="ss-color-grid" style={{ marginTop: 15 }}>
                      {[
                        '#ffffff', '#f3e8ff', '#dbeafe', '#fce7f3',
                        '#dcfce7', '#111827', '#ffedd5', '#fef3c7'
                      ].map(color => (
                        <button
                          key={color}
                          style={{ background: color }}
                          onClick={() => setBackground(color)}
                          title={color}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <label>Gradient Colors</label>

                    <div style={{ display: 'flex', gap: 12, margin: '10px 0 14px' }}>
                      <div style={{ flex: 1 }}>
                        <small>Color 1</small>
                        <input
                          type="color"
                          value={background}
                          onChange={e => setBackground(e.target.value)}
                          style={{ width: '100%', height: 42 }}
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <small>Color 2</small>
                        <input
                          type="color"
                          value={backgroundColor2}
                          onChange={e => setBackgroundColor2(e.target.value)}
                          style={{ width: '100%', height: 42 }}
                        />
                      </div>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
                      <input
                        type="checkbox"
                        checked={backgroundUseThirdColor}
                        onChange={e => setBackgroundUseThirdColor(e.target.checked)}
                      />
                      Use Third Color
                    </label>

                    {backgroundUseThirdColor && (
                      <div style={{ marginBottom: 14 }}>
                        <small>Color 3</small>
                        <input
                          type="color"
                          value={backgroundColor3}
                          onChange={e => setBackgroundColor3(e.target.value)}
                          style={{ width: '100%', height: 42 }}
                        />
                      </div>
                    )}

                    <label>Gradient Direction</label>
                    <select
                      value={backgroundDirection}
                      onChange={e => setBackgroundDirection(e.target.value as GradientDirection)}
                      style={{
                        width: '100%',
                        padding: 10,
                        margin: '8px 0 14px',
                        border: '1px solid #d1d5db',
                        borderRadius: 7
                      }}
                    >
                      <option value="horizontal">Horizontal →</option>
                      <option value="vertical">Vertical ↓</option>
                      <option value="diagonal">Diagonal ↘</option>
                    </select>

                    <div
                      style={{
                        height: 55,
                        borderRadius: 8,
                        background: backgroundUseThirdColor
                          ? `linear-gradient(${backgroundDirection === 'vertical' ? 'to bottom' : backgroundDirection === 'diagonal' ? 'to bottom right' : 'to right'}, ${background}, ${backgroundColor2}, ${backgroundColor3})`
                          : `linear-gradient(${backgroundDirection === 'vertical' ? 'to bottom' : backgroundDirection === 'diagonal' ? 'to bottom right' : 'to right'}, ${background}, ${backgroundColor2})`
                      }}
                    />
                    <small>Background Gradient Preview</small>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTool === 'Layers' && (
            <div className="ss-panel-content">
              <h3>Design Layers ({items.length})</h3>
              {items.length === 0 ? (
                <p style={{ color: '#777', fontSize: 13, lineHeight: 1.5 }}>
                  Your design is empty. Add text, shapes, or images to see them here.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <small style={{ color: '#777', marginBottom: 4 }}>
                    Top layers appear first. Select a layer to edit it.
                  </small>
                  {[...items].reverse().map((item, reverseIndex) => {
                    const originalIndex = items.length - 1 - reverseIndex;
                    const isSelected = selected === item.id;
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: 7,
                          borderRadius: 8,
                          border: isSelected ? '2px solid #7546dc' : '1px solid #e5e7eb',
                          background: isSelected ? '#f3efff' : '#fff'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(item.id);
                            setActiveTool('Adjust');
                          }}
                          title={`Select ${getLayerName(item)}`}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            border: 0,
                            background: 'transparent',
                            textAlign: 'left',
                            padding: '5px 3px',
                            cursor: 'pointer',
                            color: item.visible === false ? '#999' : '#222',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <span style={{ marginRight: 7 }}>
                            {item.type === 'text' ? 'T' : item.type === 'image' ? '▧' : '◇'}
                          </span>
                          {getLayerName(item)}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleItemVisibility(item.id)}
                          title={item.visible === false ? 'Show layer' : 'Hide layer'}
                          style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 5 }}
                        >
                          {item.visible === false ? '🙈' : '👁'}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleLayerLock(item.id)}
                          title={item.locked ? 'Unlock layer' : 'Lock layer'}
                          style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 5 }}
                        >
                          {item.locked ? '🔒' : '🔓'}
                        </button>
                        <button
                          type="button"
                          disabled={originalIndex === items.length - 1}
                          onClick={() => moveLayerById(item.id, 1)}
                          title="Bring forward"
                          style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 4, opacity: originalIndex === items.length - 1 ? 0.35 : 1 }}
                        >↑</button>
                        <button
                          type="button"
                          disabled={originalIndex === 0}
                          onClick={() => moveLayerById(item.id, -1)}
                          title="Send backward"
                          style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 4, opacity: originalIndex === 0 ? 0.35 : 1 }}
                        >↓</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTool === 'Adjust' && current && (
          <div className="ss-panel-content ss-settings">
            <h3>Rotation</h3>

            <label>Angle: {current.rotation ?? 0}°</label>
            <input
              type="range"
              min="0"
              max="360"
              value={current.rotation ?? 0}
              onChange={e => updateItem({ rotation: Number(e.target.value) })}
              style={{ width: '100%', accentColor: '#7546dc' }}
            />
            <div className="ss-rotation-presets">
              <button className="ss-option" onClick={() => updateItem({ rotation: 0 })}>Reset 0°</button>
              <button className="ss-option" onClick={() => updateItem({ rotation: 90 })}>90°</button>
              <button className="ss-option" onClick={() => updateItem({ rotation: 180 })}>180°</button>
              <button className="ss-option" onClick={() => updateItem({ rotation: 270 })}>270°</button>
            </div>

            <h3>Flip Element</h3>
            <div className="ss-flip-controls">
              <button
                className="ss-option"
                style={{ background: current.flipHorizontal ? '#eee7ff' : undefined }}
                onClick={() => updateItem({ flipHorizontal: !current.flipHorizontal })}
              >
                ↔ Flip Horizontal
              </button>
              <button
                className="ss-option"
                style={{ background: current.flipVertical ? '#eee7ff' : undefined }}
                onClick={() => updateItem({ flipVertical: !current.flipVertical })}
              >
                ↕ Flip Vertical
              </button>
            </div>

            <h3>Opacity & Shadow</h3>

            <label>
              Opacity: {Math.round((current.opacity ?? 1) * 100)}%
            </label>

            <input
              type="range"
              min="0"
              max="100"
              value={Math.round((current.opacity ?? 1) * 100)}
              onChange={e =>
                updateItem({ opacity: Number(e.target.value) / 100 })
              }
              style={{ width: '100%', accentColor: '#7546dc' }}
            />

            <div style={{ marginTop: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={current.shadowEnabled ?? false}
                  onChange={e =>
                    updateItem({ shadowEnabled: e.target.checked })
                  }
                />
                Enable Shadow
              </label>
            </div>

            {current.shadowEnabled && (
              <div style={{ marginTop: 15 }}>
                <label>Shadow Color</label>
                <input
                  type="color"
                  value={current.shadowColor ?? '#000000'}
                  onChange={e =>
                    updateItem({ shadowColor: e.target.value })
                  }
                  style={{ width: '100%', height: 40 }}
                />

                <label>Shadow Blur: {current.shadowBlur ?? 6}</label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={current.shadowBlur ?? 6}
                  onChange={e =>
                    updateItem({ shadowBlur: Number(e.target.value) })
                  }
                  style={{ width: '100%' }}
                />

                <label>
                  Horizontal Shadow: {current.shadowOffsetX ?? 5}
                </label>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={current.shadowOffsetX ?? 5}
                  onChange={e =>
                    updateItem({ shadowOffsetX: Number(e.target.value) })
                  }
                  style={{ width: '100%' }}
                />

                <label>
                  Vertical Shadow: {current.shadowOffsetY ?? 5}
                </label>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={current.shadowOffsetY ?? 5}
                  onChange={e =>
                    updateItem({ shadowOffsetY: Number(e.target.value) })
                  }
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>
          )}
          {activeTool === 'Adjust' && !current && (
            <div className="ss-panel-content ss-adjust-empty">
              <h3>Select an element to adjust</h3>
              <p>Choose text, a shape, or an image on your canvas to rotate, flip, and change its opacity or shadow.</p>
            </div>
          )}
        </aside>

        <main className="ss-workspace">
          <div style={{ width: '100%' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
              marginBottom: 18
            }}>
              <strong style={{ fontSize: 14 }}>Untitled Design</strong>

              {current && (
                <div className="ss-floating-toolbar">
                  <button onClick={duplicateItem} title="Duplicate">▢</button>
                  <button onClick={() => changeSize(-10)} title="Smaller">−</button>
                  <button onClick={() => changeSize(10)} title="Bigger">＋</button>
                  <button onClick={() => moveLayer(1)} title="Bring Forward">↑</button>
                  <button onClick={() => moveLayer(-1)} title="Send Backward">↓</button>
                  <button onClick={toggleLock} title={current.locked ? 'Unlock' : 'Lock'}>
                    {current.locked ? '🔓' : '🔒'}
                  </button>
                  <button onClick={deleteItem} disabled={current.locked} title="Delete">🗑</button>
                </div>
              )}
            </div>

            <div className="ss-canvas-area">
              <div className="ss-canvas-frame">
                <svg
                  id="ss-canvas"
                  viewBox="0 0 800 500"
                  onMouseMove={moveDrag}
                  onMouseUp={stopDrag}
                  onMouseLeave={stopDrag}
                  style={{ touchAction: 'none' }}
                >
                  <defs>
                    {items.filter(item => item.shadowEnabled).map(item => (
                      <filter
                        key={`shadow-${item.id}`}
                        id={`shadow-${item.id}`}
                        x="-50%"
                        y="-50%"
                        width="200%"
                        height="200%"
                      >
                        <feDropShadow
                          dx={item.shadowOffsetX ?? 5}
                          dy={item.shadowOffsetY ?? 5}
                          stdDeviation={item.shadowBlur ?? 6}
                          floodColor={item.shadowColor ?? '#000000'}
                          floodOpacity="0.6"
                        />
                      </filter>
                    ))}

                    {items.filter(item =>
  item.type === 'text' &&
  (item.textShadowEnabled || item.textGlowEnabled)
).map(item => (
  <filter
    key={`text-effect-${item.id}`}
    id={`text-effect-${item.id}`}
    x="-100%"
    y="-100%"
    width="300%"
    height="300%"
  >
    {item.textShadowEnabled && (
      <feDropShadow
        dx={item.textShadowOffsetX ?? 4}
        dy={item.textShadowOffsetY ?? 4}
        stdDeviation={item.textShadowBlur ?? 6}
        floodColor={item.textShadowColor ?? '#000000'}
        floodOpacity="0.8"
      />
    )}

    {item.textGlowEnabled && (
      <feGaussianBlur
        in="SourceAlpha"
        stdDeviation={item.textGlowBlur ?? 12}
        result="glow"
      />
    )}

    {item.textGlowEnabled && (
      <feFlood
        floodColor={item.textGlowColor ?? '#8b5cf6'}
        floodOpacity="0.9"
        result="glowColor"
      />
    )}

    {item.textGlowEnabled && (
      <feComposite
        in="glowColor"
        in2="glow"
        operator="in"
        result="coloredGlow"
      />
    )}

    {item.textGlowEnabled && (
      <feMerge>
        <feMergeNode in="coloredGlow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    )}
  </filter>
))}

                    {items.filter(item => item.type === 'text' && (item.textCurve ?? 0) !== 0).map(item => {
                      const curve = item.textCurve ?? 0;
                      return (
                        <path
                          key={`text-curve-${item.id}`}
                          id={`text-curve-${item.id}`}
                          d={`M ${item.x - 150} ${item.y} Q ${item.x} ${item.y - curve * 2} ${item.x + 150} ${item.y}`}
                          fill="none"
                        />
                      );
                    })}

                    {items.filter(item => item.type === 'text' && (item.textCurve ?? 0) !== 0).map(item => {
                      const curve = item.textCurve ?? 0;
                      return (
                        <path
                          key={`text-curve-${item.id}`}
                          id={`text-curve-${item.id}`}
                          d={`M ${item.x - 150} ${item.y} Q ${item.x} ${item.y - curve * 2} ${item.x + 150} ${item.y}`}
                          fill="none"
                        />
                      );
                    })}

                    <marker
                      id="ss-arrow-head"
                      markerWidth="10"
                      markerHeight="10"
                      refX="8"
                      refY="5"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
                    </marker>

                    <linearGradient
                      id="ss-background-gradient"
                      {...getGradientCoordinates(backgroundDirection)}
                    >
                      <stop offset="0%" stopColor={background} />
                      {backgroundUseThirdColor && (
                        <stop offset="50%" stopColor={backgroundColor2} />
                      )}
                      <stop offset="100%" stopColor={
                        backgroundUseThirdColor ? backgroundColor3 : backgroundColor2
                      } />
                    </linearGradient>

                    {items.filter(item => item.type === 'shape').map(item => {
                      const direction = item.gradientDirection ?? 'horizontal';

                      return (
                        <linearGradient
                          key={`gradient-${item.id}`}
                          id={`gradient-${item.id}`}
                          {...getGradientCoordinates(direction)}
                        >
                          <stop offset="0%" stopColor={item.color} />
                          {item.useThirdColor && (
                            <stop offset="50%" stopColor={item.gradientColor2 ?? '#ec4899'} />
                          )}
                          <stop
                            offset="100%"
                            stopColor={
                              item.useThirdColor
                                ? item.gradientColor3 ?? '#f59e0b'
                                : item.gradientColor2 ?? '#ec4899'
                            }
                          />
                        </linearGradient>
                      );
                    })}
                  </defs>

                  <rect
                    width="800"
                    height="500"
                    fill={backgroundFillType === 'gradient'
                      ? 'url(#ss-background-gradient)'
                      : background}
                  />

                  {/* eslint-disable-next-line react-hooks/refs -- Event handlers access drag refs only on interaction. */}
                  {items.filter(item => item.visible !== false).map(item => {
                    const width = item.type === 'text'
                      ? 300
                      : item.width ?? 180;

                    const height = item.type === 'text'
                      ? item.fontSize + 20
                      : item.height ?? 120;

                    const boxX = item.type === 'text'
                      ? item.x - width / 2
                      : item.x;

                    const boxY = item.type === 'text'
                      ? item.y - item.fontSize
                      : item.y;

                    const shapeFill = item.fillType === 'gradient'
                      ? `url(#gradient-${item.id})`
                      : item.color;

                    const borderStroke = item.borderEnabled
                      ? item.borderColor ?? '#000000'
                      : 'none';

                    const borderStrokeWidth = item.borderEnabled
                      ? item.borderWidth ?? 2
                      : 0;

                    const borderDashArray =
                      item.borderEnabled && item.borderStyle === 'dashed'
                        ? '8 5'
                        : item.borderEnabled && item.borderStyle === 'dotted'
                          ? '2 5'
                          : undefined;

                    const handles = [
                      { name: 'nw', x: boxX, y: boxY },
                      { name: 'n', x: boxX + width / 2, y: boxY },
                      { name: 'ne', x: boxX + width, y: boxY },
                      { name: 'e', x: boxX + width, y: boxY + height / 2 },
                      { name: 'se', x: boxX + width, y: boxY + height },
                      { name: 's', x: boxX + width / 2, y: boxY + height },
                      { name: 'sw', x: boxX, y: boxY + height },
                      { name: 'w', x: boxX, y: boxY + height / 2 }
                    ];

                    return (
                      <g
                        key={item.id}
                        transform={`translate(${boxX + width / 2} ${boxY + height / 2}) rotate(${item.rotation ?? 0}) scale(${item.flipHorizontal ? -1 : 1} ${item.flipVertical ? -1 : 1}) translate(${-boxX - width / 2} ${-boxY - height / 2})`}
                        onClick={() => {
                          setSelected(item.id);
                          setActiveTool('Adjust');
                        }}
                        onMouseDown={e => startDrag(e, item)}
                        opacity={item.opacity ?? 1}
                        filter={
  item.type === 'text' &&
  (item.textShadowEnabled || item.textGlowEnabled)
    ? `url(#text-effect-${item.id})`
    : item.shadowEnabled
      ? `url(#shadow-${item.id})`
      : undefined
}
                        style={{ cursor: item.locked ? 'not-allowed' : 'grab' }}
                      >
                        {item.type === 'image' ? (
                          <image
                            href={item.src}
                            x={item.x}
                            y={item.y}
                            width={item.width ?? 300}
                            height={item.height ?? 200}
                            preserveAspectRatio="xMidYMid meet"
                          />
                        ) : item.type === 'shape' ? (
                          <>
                            {item.shapeKind === 'circle' ? (
                              <ellipse
                                cx={item.x + width / 2}
                                cy={item.y + height / 2}
                                rx={width / 2}
                                ry={height / 2}
                                fill={shapeFill}
                                stroke={borderStroke}
                                strokeWidth={borderStrokeWidth}
                                strokeDasharray={borderDashArray}
                              />
                            ) : item.shapeKind === 'triangle' ? (
                              <polygon
                                points={`${item.x + width / 2},${item.y} ${item.x + width},${item.y + height} ${item.x},${item.y + height}`}
                                fill={shapeFill}
                                stroke={borderStroke}
                                strokeWidth={borderStrokeWidth}
                                strokeDasharray={borderDashArray}
                              />
                            ) : item.shapeKind === 'line' ? (
                              <line
                                x1={item.x}
                                y1={item.y + height / 2}
                                x2={item.x + width}
                                y2={item.y + height / 2}
                                stroke={item.borderEnabled ? borderStroke : shapeFill}
                                strokeWidth={item.borderEnabled ? borderStrokeWidth : 5}
                                strokeDasharray={borderDashArray}
                                strokeLinecap="round"
                              />
                            ) : item.shapeKind === 'arrow' ? (
                              <line
                                x1={item.x}
                                y1={item.y + height / 2}
                                x2={item.x + width}
                                y2={item.y + height / 2}
                                stroke={item.borderEnabled ? borderStroke : shapeFill}
                                strokeWidth={item.borderEnabled ? borderStrokeWidth : 6}
                                strokeDasharray={borderDashArray}
                                strokeLinecap="round"
                                markerEnd="url(#ss-arrow-head)"
                              />
                            ) : (
                              <rect
                                x={item.x}
                                y={item.y}
                                width={width}
                                height={height}
                                rx="10"
                                fill={shapeFill}
                                stroke={borderStroke}
                                strokeWidth={borderStrokeWidth}
                                strokeDasharray={borderDashArray}
                              />
                            )}
                          </>
                        ) : (
                          <>
                            {item.textBackgroundEnabled && (() => {
                              const lines = (item.text ?? '').split('\n');
                              const maxLength = Math.max(
                                ...lines.map(line => line.length),
                                1
                              );
                              const fontSize = item.fontSize ?? 24;
                              const padding = item.textHighlightPadding ?? 6;

                              return (
                                <rect
                                  x={
                                    item.x -
                                    maxLength * fontSize * 0.3 -
                                    padding
                                  }
                                  y={
                                    item.y -
                                    fontSize * 0.9 -
                                    padding
                                  }
                                  width={
                                    maxLength * fontSize * 0.6 +
                                    padding * 2
                                  }
                                  height={
                                    lines.length *
                                      fontSize *
                                      (item.lineHeight ?? 1.2) +
                                    padding * 2
                                  }
                                  rx={item.textHighlightRadius ?? 5}
                                  fill={item.textBackgroundColor ?? '#ffff00'}
                                  fillOpacity={
                                    (item.textHighlightOpacity ?? 100) / 100
                                  }
                                />
                              );
                            })()}

                            <text
                              x={item.x}
                              y={item.y}
                              fill={item.color}
                              stroke={item.textOutlineEnabled ? (item.textOutlineColor ?? '#000000') : 'none'}
                              strokeWidth={item.textOutlineEnabled ? 2 : 0}
                              paintOrder="stroke"
                              fontSize={item.fontSize}
                              fontWeight={item.bold ? 'bold' : 'normal'}
                              fontStyle={item.italic ? 'italic' : 'normal'}
                              fontFamily={item.fontFamily ?? 'Arial'}
                              letterSpacing={item.letterSpacing ?? 0}
                              style={{
                                lineHeight: item.lineHeight ?? 1.2,
                              }}
                              textDecoration={item.underline ? 'underline' : 'none'}
                              filter={
  item.textShadowEnabled || item.textGlowEnabled
    ? `url(#text-effect-${item.id})`
    : undefined
}
                              textAnchor={
                                item.textAlign === 'left'
                                  ? 'start'
                                  : item.textAlign === 'right'
                                    ? 'end'
                                    : 'middle'
                              }
                            >
                              {(item.textCurve ?? 0) !== 0 ? (
                                <textPath
                                  href={`#text-curve-${item.id}`}
                                  startOffset="50%"
                                  textAnchor="middle"
                                >
                                  {item.text ?? ''}
                                </textPath>
                              ) : (
                                (item.text ?? '').split('\\n').map((line, index) => (
                                  <tspan
                                    key={index}
                                    x={item.x}
                                    dy={
                                      index === 0
                                        ? 0
                                        : (item.fontSize ?? 24) * (item.lineHeight ?? 1.2)
                                    }
                                  >
                                    {line}
                                  </tspan>
                                ))
                              )}
                            </text>
                          </>
                        )}

                        {selected === item.id && (
                          <>
                            <rect
                              x={boxX}
                              y={boxY}
                              width={width}
                              height={height}
                              fill="none"
                              stroke="#7546dc"
                              strokeWidth="2"
                              strokeDasharray="5 4"
                              pointerEvents="none"
                            />

                            {!item.locked && handles.map(handle => (
                              <circle
                                key={handle.name}
                                cx={handle.x}
                                cy={handle.y}
                                r="7"
                                fill="white"
                                stroke="#7546dc"
                                strokeWidth="2"
                                style={{ cursor: `${handle.name}-resize` }}
                                onMouseDown={e => startResize(e, item, handle.name)}
                              />
                            ))}
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}