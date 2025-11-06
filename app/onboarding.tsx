import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

const { width } = Dimensions.get('window');

const slides = [
  {
    title: 'Privacy First',
    description: 'All your subscription data is stored locally on your device. No sign-in required, no cloud sync.',
    icon: '🔒',
  },
  {
    title: 'Works Offline',
    description: 'Track your subscriptions without an internet connection. Everything works completely offline.',
    icon: '📱',
  },
  {
    title: 'Smart Reminders',
    description: 'Get notified before your subscriptions renew. Grant notification permissions to receive reminders.',
    icon: '🔔',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  };

  const handleNext = async () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // Request notification permissions on last slide
      await requestPermissions();
      // TODO: Mark onboarding as completed in settings
      router.replace('/(tabs)');
    }
  };

  const handleSkip = async () => {
    await requestPermissions();
    router.replace('/(tabs)');
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const slideIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentSlide(slideIndex);
        }}>
        {slides.map((slide, index) => (
          <View
            key={index}
            style={{ width }}
            className="flex-1 justify-center items-center px-8 bg-background">
            <Text className="text-6xl mb-8">{slide.icon}</Text>
            <Text className="text-3xl font-bold mb-4 text-center text-foreground">
              {slide.title}
            </Text>
            <Text className="text-lg text-center text-muted-foreground">
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Indicators */}
      <View className="flex-row justify-center mb-8">
        {slides.map((_, index) => (
          <View
            key={index}
            className={`h-2 w-2 rounded-full mx-1 ${
              index === currentSlide
                ? 'bg-primary'
                : 'bg-muted'
            }`}
          />
        ))}
      </View>

      {/* Buttons */}
      <View className="px-8 pb-8">
        <TouchableOpacity
          onPress={handleNext}
          className="py-4 px-6 rounded-lg mb-3 bg-primary">
          <Text className="text-center text-primary-foreground font-semibold text-lg">
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
        {currentSlide < slides.length - 1 && (
          <TouchableOpacity onPress={handleSkip}>
            <Text className="text-center text-muted-foreground">
              Skip
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
