import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { WelcomeExperience } from '../components/WelcomeExperience';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <WelcomeExperience
      actionLabel="Tab Library"
      footerText="Dad Band Bass welcome screen for the free single-setlist version."
      onPrimaryAction={() => navigation.navigate('MainTabs')}
    />
  );
}
