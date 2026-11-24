import { useAppSelector } from '../../store/hooks';
import { scaleFont } from '../../constants/typography';

export const useFontScale = () => {
  const largeTextMode = useAppSelector((state) => state.ui.largeTextMode);
  return {
    largeTextMode,
    fs: (size: number) => scaleFont(size, largeTextMode),
  };
};
