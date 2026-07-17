'use client'
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import {
    GoogleMap,
    useJsApiLoader,
    Marker,
    InfoWindow,
    DirectionsRenderer,
} from '@react-google-maps/api';
import type { Libraries } from '@react-google-maps/api';
import { Loader2, Search, MapPin, Star, Navigation, ChevronLeft, X } from 'lucide-react';

interface UserLocation {
    lat: number
    lng: number
}

const mapContainerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "16px"
};

// defined outside component to prevent re-renders
const libraries: Libraries = ["places"];

const NearbyContent = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [places, setPlaces] = useState<google.maps.places.PlaceResult[]>([]);
    const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
    const [isSearching, setIsSearching] = useState(false);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [locationError, setLocationError] = useState("");
    const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 });

    const mapRef = useRef<google.maps.Map | null>(null);

    // ✅ FIX 1: Keep a ref of userLocation so handleSearch never captures a stale closure
    const userLocationRef = useRef<UserLocation | null>(null);

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // ✅ FIX 2: ALL functions defined BEFORE early returns so useEffects below
    //           never hit a ReferenceError (temporal dead zone).
    // ─────────────────────────────────────────────────────────────────────────

    // ── GET USER LOCATION ──
    const getUserLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                userLocationRef.current = location;   // ✅ keep ref in sync
                setUserLocation(location);
                setMapCenter(location);
                setLocationError("");
            },
            (error) => {
                setLocationError("Could not get your location. Please allow location access.");
                console.error("Location error:", error);
            }
        );
    }, []);

    // ── SEARCH NEARBY PLACES ──
    // ✅ FIX 3: Accept optional queryOverride so quick-search buttons can pass
    //           the new value directly — avoids the stale-closure setTimeout hack.
    const handleSearch = useCallback((queryOverride?: string) => {
        const query = (queryOverride ?? searchQuery).trim();

        if (!query) return;

        const loc = userLocationRef.current;
        if (!loc) {
            setLocationError("Please allow location access to search nearby.");
            return;
        }
        if (!mapRef.current) return;

        setIsSearching(true);
        setPlaces([]);
        setSelectedPlace(null);
        setDirections(null);

        const service = new google.maps.places.PlacesService(mapRef.current);

        const request: google.maps.places.PlaceSearchRequest = {
            location: new google.maps.LatLng(loc.lat, loc.lng),   // ✅ reads ref, never stale
            radius: 5000,
            keyword: query,
        };

        service.nearbySearch(request, (results, serviceStatus) => {
            setIsSearching(false);
            if (serviceStatus === google.maps.places.PlacesServiceStatus.OK && results) {
                // filter only places that have geometry/location
                const validResults = results.filter(
                    place => place.geometry?.location
                );
                setPlaces(validResults);

                // fit map bounds to show all results
                if (validResults.length > 0) {
                    const bounds = new google.maps.LatLngBounds();
                    validResults.forEach(place => {
                        if (place.geometry?.location) {
                            bounds.extend(place.geometry.location);
                        }
                    });
                    mapRef.current?.fitBounds(bounds);
                }
            } else {
                setPlaces([]);
            }
        });
    }, [searchQuery]);   // searchQuery in deps — used for manual search bar hits

    // ── GET DIRECTIONS ──
    const handleGetDirections = useCallback((place: google.maps.places.PlaceResult) => {
        const loc = userLocationRef.current;    // ✅ always fresh via ref
        if (!loc || !place.geometry?.location) return;

        const directionsService = new google.maps.DirectionsService();

        directionsService.route({
            origin: new google.maps.LatLng(loc.lat, loc.lng),
            destination: place.geometry.location,
            travelMode: google.maps.TravelMode.DRIVING,
        }, (result, dirStatus) => {
            if (dirStatus === google.maps.DirectionsStatus.OK && result) {
                setDirections(result);
                setSelectedPlace(place);
                setMapCenter({
                    lat: place.geometry!.location!.lat(),
                    lng: place.geometry!.location!.lng()
                });
            }
        });
    }, []);   // no deps needed — reads ref

    // ── CLEAR DIRECTIONS ──
    const handleClearDirections = useCallback(() => {
        setDirections(null);
        setSelectedPlace(null);
        const loc = userLocationRef.current;
        if (loc) setMapCenter(loc);
    }, []);

    // ── MAP LOAD CALLBACK ──
    // ✅ FIX 4: useCallback is a hook — must be called before any early return
    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // ✅ FIX 5: ALL useEffects before early returns (Rules of Hooks)
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/signIn");
    }, [status, router]);

    useEffect(() => {
        if (status === "authenticated") {
            getUserLocation();
        }
    }, [status, getUserLocation]);

    // Auto-search when location + map both become ready (e.g. navigated from Home with ?q=)
    useEffect(() => {
        if (userLocation && searchQuery && isLoaded) {
            handleSearch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userLocation, isLoaded]);   // intentionally fire only on these two changes

    // ─────────────────────────────────────────────────────────────────────────
    // Early returns — safe now because ALL hooks are above
    // ─────────────────────────────────────────────────────────────────────────

    if (status === "loading" || !isLoaded) return (
        <div className="flex flex-col justify-center items-center min-h-screen gap-3"
            style={{ background: "#f0faf8" }}>
            <Loader2 className="animate-spin h-8 w-8" style={{ color: "#0d9488" }} />
            <p style={{ color: "#4a7c6f" }} className="text-sm">
                {!isLoaded ? "Loading Maps..." : "Loading..."}
            </p>
        </div>
    )

    if (loadError) return (
        <div className="flex justify-center items-center min-h-screen" style={{ background: "#f0faf8" }}>
            <p style={{ color: "#dc2626" }}>Failed to load Google Maps. Check your API key.</p>
        </div>
    )

    if (!session) return null;

    const quickSearches = ["Hospital", "Pharmacy", "Doctor", "Clinic", "Dentist", "Cardiologist"];

    return (
        <div className="min-h-screen" style={{ background: "#f0faf8", fontFamily: "Georgia, serif" }}>
            <div className="max-w-7xl mx-auto px-6 py-10">

                {/* ── HEADER ── */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        style={{ color: "#0d9488", fontWeight: 600 }}
                        className="flex items-center gap-1 text-sm mb-4 hover:opacity-80">
                        <ChevronLeft className="h-4 w-4" /> Back
                    </button>
                    <h1 style={{ color: "#0f4c3a", fontWeight: 800 }} className="text-4xl mb-1">
                        Find{" "}
                        <span style={{
                            background: "linear-gradient(135deg, #0d9488, #06b6d4)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}>Nearby</span>
                    </h1>
                    <p style={{ color: "#4a7c6f" }}>
                        Search for hospitals, clinics, pharmacies and doctors near you
                    </p>
                </div>

                {/* ── SEARCH BAR ── */}
                <div style={{ background: "white", border: "1px solid #c9ebe4" }}
                    className="rounded-2xl p-4 mb-4 shadow-sm">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            placeholder="Search hospitals, doctors, pharmacies..."
                            style={{
                                flex: 1,
                                border: "1px solid #c9ebe4",
                                borderRadius: 10,
                                padding: "10px 14px",
                                fontSize: 14,
                                color: "#0f4c3a",
                                outline: "none"
                            }}
                        />
                        <button
                            onClick={() => handleSearch()}
                            disabled={isSearching || !searchQuery.trim()}
                            style={{
                                background: isSearching ? "#c9ebe4" : "linear-gradient(135deg, #0d9488, #06b6d4)",
                                color: "white",
                                fontWeight: 600,
                                padding: "10px 20px",
                                borderRadius: 10,
                                border: "none",
                                cursor: isSearching ? "not-allowed" : "pointer"
                            }}
                            className="flex items-center gap-2 hover:opacity-90">
                            {isSearching
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Search className="h-4 w-4" />
                            }
                            Search
                        </button>
                        <button
                            onClick={getUserLocation}
                            style={{ border: "1.5px solid #0d9488", color: "#0d9488", background: "white", padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}
                            className="hover:opacity-80 transition-opacity"
                            title="Use my location">
                            <Navigation className="h-4 w-4" />
                        </button>
                    </div>

                    {locationError && (
                        <p style={{ color: "#f97316" }} className="text-xs mt-2">
                            ⚠️ {locationError}
                        </p>
                    )}

                    <div className="flex gap-2 mt-3 flex-wrap">
                        {quickSearches.map(q => (
                            <button
                                key={q}
                                onClick={() => {
                                    // ✅ FIX 6: Set state AND pass value directly to handleSearch.
                                    //    No more setTimeout — no more stale closure.
                                    setSearchQuery(q);
                                    handleSearch(q);
                                }}
                                style={{
                                    background: searchQuery === q ? "#ccfbf1" : "#f0faf8",
                                    color: searchQuery === q ? "#0d9488" : "#4a7c6f",
                                    border: `1px solid ${searchQuery === q ? "#0d9488" : "#c9ebe4"}`,
                                    fontWeight: 600
                                }}
                                className="px-3 py-1.5 rounded-full text-xs hover:opacity-80 transition-all">
                                {q}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── MAIN CONTENT ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── LEFT: RESULTS LIST ── */}
                    <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto pr-1">

                        {/* directions active banner */}
                        {directions && selectedPlace && (
                            <div style={{ background: "#ccfbf1", border: "1px solid #0d9488" }}
                                className="rounded-xl p-3 flex items-center justify-between">
                                <div>
                                    <p style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-sm">
                                        Navigating to:
                                    </p>
                                    <p style={{ color: "#0d9488" }} className="text-xs">
                                        {selectedPlace.name}
                                    </p>
                                </div>
                                <button onClick={handleClearDirections} style={{ color: "#dc2626" }}>
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {isSearching ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin h-6 w-6" style={{ color: "#0d9488" }} />
                            </div>
                        ) : places.length === 0 ? (
                            <div style={{ background: "white", border: "1px solid #c9ebe4" }}
                                className="rounded-2xl p-8 text-center shadow-sm">
                                <MapPin className="h-12 w-12 mx-auto mb-3" style={{ color: "#c9ebe4" }} />
                                <p style={{ color: "#4a7c6f" }} className="text-sm">
                                    {searchQuery
                                        ? "No results found. Try a different search."
                                        : "Search for hospitals, clinics or pharmacies near you"
                                    }
                                </p>
                            </div>
                        ) : (
                            <>
                                <p style={{ color: "#4a7c6f" }} className="text-xs px-1">
                                    {places.length} results found
                                </p>
                                {places.map(place => (
                                    <div
                                        key={place.place_id}
                                        style={{
                                            background: "white",
                                            border: selectedPlace?.place_id === place.place_id
                                                ? "2px solid #0d9488"
                                                : "1px solid #c9ebe4"
                                        }}
                                        className="rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                                        onClick={() => {
                                            setSelectedPlace(place);
                                            setMapCenter({
                                                lat: place.geometry!.location!.lat(),
                                                lng: place.geometry!.location!.lng()
                                            });
                                        }}>

                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <p style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-sm">
                                                {place.name}
                                            </p>
                                            {/* open/closed — use isOpen() not open_now ✅ */}
                                            {place.opening_hours && (
                                                <span style={{
                                                    background: place.opening_hours.isOpen?.() ? "#d1fae5" : "#fee2e2",
                                                    color: place.opening_hours.isOpen?.() ? "#059669" : "#dc2626",
                                                    fontWeight: 600,
                                                    whiteSpace: "nowrap"
                                                }} className="text-xs px-2 py-0.5 rounded-full">
                                                    {place.opening_hours.isOpen?.() ? "Open" : "Closed"}
                                                </span>
                                            )}
                                        </div>

                                        <p style={{ color: "#4a7c6f" }} className="text-xs mb-3 flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {place.vicinity}
                                        </p>

                                        {place.rating && (
                                            <p style={{ color: "#f97316" }} className="text-xs mb-3 flex items-center gap-1">
                                                <Star className="h-3 w-3 fill-current" />
                                                {place.rating} / 5
                                            </p>
                                        )}

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleGetDirections(place);
                                            }}
                                            style={{
                                                background: "linear-gradient(135deg, #0d9488, #06b6d4)",
                                                color: "white",
                                                fontWeight: 600,
                                                width: "100%",
                                                padding: "8px",
                                                borderRadius: 8,
                                                border: "none",
                                                cursor: "pointer"
                                            }}
                                            className="flex items-center justify-center gap-2 text-xs hover:opacity-90">
                                            <Navigation className="h-3 w-3" />
                                            Get Directions
                                        </button>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    {/* ── RIGHT: GOOGLE MAP ── */}
                    <div className="lg:col-span-2 h-[600px] rounded-2xl overflow-hidden shadow-sm"
                        style={{ border: "1px solid #c9ebe4" }}>
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={mapCenter}
                            zoom={13}
                            onLoad={onMapLoad}
                            options={{
                                zoomControl: true,
                                streetViewControl: false,
                                mapTypeControl: false,
                                fullscreenControl: true,
                            }}>

                            {/* blue dot — user location */}
                            {userLocation && (
                                <Marker
                                    position={userLocation}
                                    icon={{
                                        url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                                        scaledSize: new google.maps.Size(40, 40)
                                    }}
                                    title="Your Location"
                                />
                            )}

                            {/* red dots — search results */}
                            {places.map(place => (
                                <Marker
                                    key={place.place_id}
                                    position={{
                                        lat: place.geometry!.location!.lat(),
                                        lng: place.geometry!.location!.lng()
                                    }}
                                    onClick={() => {
                                        setSelectedPlace(place);
                                        setMapCenter({
                                            lat: place.geometry!.location!.lat(),
                                            lng: place.geometry!.location!.lng()
                                        });
                                    }}
                                    icon={{
                                        url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                                        scaledSize: new google.maps.Size(35, 35)
                                    }}
                                />
                            ))}

                            {/* info window — selected place */}
                            {selectedPlace && !directions && (
                                <InfoWindow
                                    position={{
                                        lat: selectedPlace.geometry!.location!.lat(),
                                        lng: selectedPlace.geometry!.location!.lng()
                                    }}
                                    onCloseClick={() => setSelectedPlace(null)}>
                                    <div style={{ fontFamily: "Georgia, serif", maxWidth: 200 }}>
                                        <p style={{ color: "#0f4c3a", fontWeight: 700, fontSize: 13 }}>
                                            {selectedPlace.name}
                                        </p>
                                        <p style={{ color: "#4a7c6f", fontSize: 11, marginTop: 4 }}>
                                            {selectedPlace.vicinity}
                                        </p>
                                        {selectedPlace.rating && (
                                            <p style={{ color: "#f97316", fontSize: 11, marginTop: 4 }}>
                                                ⭐ {selectedPlace.rating} / 5
                                            </p>
                                        )}
                                        {/* use isOpen() not open_now ✅ */}
                                        {selectedPlace.opening_hours && (
                                            <p style={{
                                                color: selectedPlace.opening_hours.isOpen?.() ? "#059669" : "#dc2626",
                                                fontSize: 11,
                                                fontWeight: 600,
                                                marginTop: 4
                                            }}>
                                                {selectedPlace.opening_hours.isOpen?.() ? "● Open Now" : "● Closed"}
                                            </p>
                                        )}
                                        <button
                                            onClick={() => handleGetDirections(selectedPlace)}
                                            style={{
                                                background: "linear-gradient(135deg, #0d9488, #06b6d4)",
                                                color: "white",
                                                fontWeight: 600,
                                                width: "100%",
                                                padding: "6px",
                                                borderRadius: 6,
                                                border: "none",
                                                cursor: "pointer",
                                                marginTop: 8,
                                                fontSize: 11
                                            }}>
                                            Get Directions
                                        </button>
                                    </div>
                                </InfoWindow>
                            )}

                            {/* directions route line */}
                            {directions && (
                                <DirectionsRenderer
                                    directions={directions}
                                    options={{
                                        polylineOptions: {
                                            strokeColor: "#0d9488",
                                            strokeWeight: 5,
                                        },
                                        suppressMarkers: false,
                                    }}
                                />
                            )}
                        </GoogleMap>
                    </div>
                </div>
            </div>
        </div>
    )
}

const NearbyPage = () => {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center min-h-screen" style={{ background: "#f0faf8" }}>
                <Loader2 className="animate-spin h-6 w-6" style={{ color: "#0d9488" }} />
            </div>
        }>
            <NearbyContent />
        </Suspense>
    )
}

export default NearbyPage;