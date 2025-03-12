import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ImageSourcePropType,
} from "react-native";
// import { NavigationProp, ParamListBase } from "@react-navigation/native";
import FavoriteBadge from "./FavoriteBadge";

const { width, height } = Dimensions.get("window");

interface Property {
  id: string;
  name: string;
  price: number;
  bed: number;
  bath: number;
  distance: number;
  location: string;
  image: ImageSourcePropType;
  status?: string;
}

interface PropertyDetails {
  item: Property;
  onPress: () => void;
}
const PropertyCard: React.FC<PropertyDetails> = ({ item, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={1}>
      <View style={styles.propertyCard}>
        <View style={styles.imageContainer}>
          <Image source={item.image} style={styles.propertyImage} />
          <FavoriteBadge id={item.id}/>
        </View>
        <View style={styles.propertyDetails}>
          <Text style={styles.propertyName}>{item.name}</Text>
          <Text style={styles.propertyPrice}>
            ${item.price.toLocaleString()}
          </Text>
          <View style={{ flex: 1, flexDirection: "row" }}>
            <Text style={styles.propertyBath}>
              {item.bed}bed | {item.bath}bath, {item.distance} sqft
            </Text>
          </View>
          <Text style={styles.propertyLocation}>{item.location}</Text>
          <Text style={styles.propertyStatus}>{item.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default PropertyCard;

const styles = StyleSheet.create({
  propertyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
  },
  propertyImage: {
    width: width * 0.9,
    height: height * 0.3,
    borderRadius: 12,
    alignSelf: "center",
    marginTop: 10,
  },
  propertyDetails: {
    padding: 15,
  },
  propertyName: { fontSize: 18, fontWeight: "bold", color: "#525254" },
  propertyPrice: {
    fontSize: 17,
    color: "#ab0f0f",
    marginVertical: 5,
    fontWeight: "bold",
  },
  propertyBath: {
    color: "gray",
  },
  propertyLocation: { fontSize: 14, color: "#666", fontWeight: "bold" },
  propertyStatus: {
    position: "absolute",
    bottom: 18,
    right: 16,
    backgroundColor: "blue",
    color: "white",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
    // textTransform: "capitalize",
    justifyContent: "center",
    alignItems: "center",
  },
});
