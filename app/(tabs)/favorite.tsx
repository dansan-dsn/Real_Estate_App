import { useRef, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { View, StyleSheet, Animated, FlatList } from 'react-native';
import { Appbar, Button, Text } from 'react-native-paper';
import { properties } from '@/shared/data/property';
import { useThemeStore } from '@/stores/useTheme';
import { useFavoriteStore } from '@/stores/favorites';
import { useSnackbar } from '@/stores/snackbar';
import PropertyCardHorizontal from '@/components/blocks/property/PropertyCardHorizontal';
import ConnectionTest from '@/components/ConnectionTest';

const Favorite = () => {
  const flatListRef = useRef<FlatList>(null);

  const router = useRouter();
  const { colors } = useThemeStore();
  const { favorites, toggleFavorite } = useFavoriteStore();
  const { showSnackbar } = useSnackbar();

  const favoritesProperty = useMemo(() => {
    return properties.filter((p) => favorites.includes(Number(p?.property_id)));
  }, [favorites]);

  const handleFavRemove = (id: number) => {
    toggleFavorite(Number(id));
    showSnackbar('Removed from favorites', colors.black);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header
        elevated
        style={{ backgroundColor: colors.headerBackground }}
      >
        <Appbar.Content
          title="Favorites"
          titleStyle={[
            { fontWeight: 'bold', fontSize: 24, color: colors.headerText },
          ]}
        />
      </Appbar.Header>
      <Animated.FlatList
        ref={flatListRef}
        data={favoritesProperty}
        keyExtractor={(item) => String(item.property_id)}
        style={{ backgroundColor: colors.background }}
        renderItem={({ item }) => (
          <PropertyCardHorizontal
            property={item}
            onPress={() => {
              router.push(`/property/${item.property_id}`);
            }}
            onRemove={() => handleFavRemove(item.property_id)}
            colors={colors}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View
            style={[
              styles.noContainer,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Text variant="displayMedium" style={styles.emoji}>
              💔
            </Text>
            <Text
              variant="titleLarge"
              style={[styles.title, { color: colors.text }]}
            >
              No Favorites Yet
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.subtitle, { color: colors.textSecondary }]}
            >
              Tap the <Text style={styles.heart}>♥</Text> on any property to
              add it to your favorites.
            </Text>
            <Button
              mode="contained"
              style={styles.button}
              onPress={() => router.push('/explore')}
              icon="magnify"
              labelStyle={{ fontWeight: 'bold' }}
            >
              Explore Properties
            </Button>
          </View>
        }
      />
      <ConnectionTest />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingBottom: 30,
    paddingHorizontal: 8,
    paddingTop: 20,
  },
  noContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 16,
    elevation: 2,
  },
  emoji: { marginBottom: 12 },
  title: { fontWeight: 'bold', marginBottom: 6 },
  subtitle: { textAlign: 'center', marginBottom: 18 },
  heart: { color: '#e53935', fontWeight: 'bold' },
  button: { marginTop: 8, width: '80%', borderRadius: 25 },
});

export default Favorite;
