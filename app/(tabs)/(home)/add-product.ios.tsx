
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { Category } from '@/types/Product';
import { productService } from '@/services/productService';

interface Farm {
  id: string;
  name: string;
}

export default function AddProductScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [unit, setUnit] = useState('Per kg');
  const [categoryId, setCategoryId] = useState('');
  const [farmId, setFarmId] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndRequestPermissions();
    loadData();
  }, []);

  const checkAuthAndRequestPermissions = async () => {
    // Check if user is signed in
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user?.id);
    
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to add products',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
      return;
    }

    // Request image picker permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to upload product images.'
      );
    }
  };

  const loadData = async () => {
    try {
      const [categoriesData, farmsData] = await Promise.all([
        productService.getCategories(),
        productService.getFarms(),
      ]);
      
      setCategories(categoriesData);
      setFarms(farmsData);
      
      // Set default values
      if (categoriesData.length > 0) {
        setCategoryId(categoriesData[0].id);
      }
      if (farmsData.length > 0) {
        setFarmId(farmsData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load categories and farms');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      setUploading(true);
      console.log('Starting image upload...');
      
      // Get file extension
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      console.log('File path:', filePath);

      // Fetch the image as a blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Convert blob to ArrayBuffer
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });

      console.log('Uploading to Supabase Storage...');

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate form
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a product name');
      return;
    }
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price');
      return;
    }
    if (!categoryId) {
      Alert.alert('Validation Error', 'Please select a category');
      return;
    }
    if (!farmId) {
      Alert.alert('Validation Error', 'Please select a farm');
      return;
    }

    try {
      setLoading(true);
      console.log('Starting product submission...');

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be signed in to add products');
        return;
      }

      console.log('User authenticated:', user.id);

      // Upload image if selected
      let imageUrl = '';
      if (imageUri) {
        console.log('Uploading image...');
        const uploadedUrl = await uploadImage(imageUri);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
          console.log('Image uploaded successfully');
        } else {
          console.log('Image upload failed, continuing without image');
        }
      }

      // Prepare product data
      const productData = {
        name: name.trim(),
        description: description.trim() || null,
        price: Number(price),
        original_price: originalPrice.trim() ? Number(originalPrice) : null,
        unit: unit,
        category_id: categoryId,
        farm_id: farmId,
        image: imageUrl || null,
        in_stock: true,
        rating: 0,
      };

      console.log('Creating product with data:', productData);

      // Create product
      const { data, error } = await supabase
        .from('marketplace_products')
        .insert(productData)
        .select()
        .single();

      if (error) {
        console.error('Error creating product:', error);
        throw error;
      }

      console.log('Product created successfully:', data);

      Alert.alert(
        'Success',
        'Product added successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting product:', error);
      Alert.alert('Error', error.message || 'Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow_back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Add New Product</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.form}>
          {/* Image Upload */}
          <View style={styles.imageSection}>
            <Text style={styles.label}>Product Image</Text>
            <TouchableOpacity
              style={styles.imagePicker}
              onPress={handlePickImage}
              disabled={uploading}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <IconSymbol
                    ios_icon_name="photo"
                    android_material_icon_name="add_photo_alternate"
                    size={48}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.imagePlaceholderText}>Tap to add image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Product Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Fresh Tomatoes"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter product description..."
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Price */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Price *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Original Price</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                value={originalPrice}
                onChangeText={setOriginalPrice}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Unit */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Unit</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Per kg, Per piece"
              placeholderTextColor={colors.textSecondary}
              value={unit}
              onChangeText={setUnit}
            />
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    categoryId === category.id && styles.categoryChipSelected,
                  ]}
                  onPress={() => setCategoryId(category.id)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      categoryId === category.id && styles.categoryChipTextSelected,
                    ]}
                  >
                    {category.emoji} {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Farm */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Farm *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
            >
              {farms.map((farm) => (
                <TouchableOpacity
                  key={farm.id}
                  style={[
                    styles.categoryChip,
                    farmId === farm.id && styles.categoryChipSelected,
                  ]}
                  onPress={() => setFarmId(farm.id)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      farmId === farm.id && styles.categoryChipTextSelected,
                    ]}
                  >
                    {farm.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, (loading || uploading) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || uploading}
          >
            {loading || uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Add Product</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  form: {
    paddingHorizontal: 20,
  },
  imageSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  imagePicker: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  categoryList: {
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
