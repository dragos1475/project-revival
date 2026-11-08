// Photographs of the LTSER areas, free under the Unsplash License. Each location was checked on
// the photo page; the caption shows the photographer and that location.
export interface Photo {
  id: string;
  page: string;
  author: string;
  location: string;
}

const make = (id: string, page: string, author: string, location: string): Photo => ({ id, page, author, location });

export const AREA_PHOTOS: Record<number, Photo> = {
  1: make("photo-1674840966232-1ee420bf80b9", "https://unsplash.com/photos/Ehnkd6JFWZg", "Marian Strinoiu", "Delta Dunării"),
  2: make("photo-1619291785182-59edd5fd926f", "https://unsplash.com/photos/M1tG3cFzCRM", "Marius Spita", "Brăila"),
  3: make("photo-1600689882600-eaa063a0cfcc", "https://unsplash.com/photos/0nBhC_FJ0PE", "Mihai Strompl", "Comana"),
  4: make("photo-1578346536677-9bab9cfc3fd9", "https://unsplash.com/photos/g13ENc51-9U", "Mari Potter", "Piatra Craiului"),
  5: make("photo-1598439473183-42c9301db5dc", "https://unsplash.com/photos/ogYAqqIurgs", "Michael Michelovski", "Munții Rodnei"),
  6: make("photo-1543227422-db13364de9f4", "https://unsplash.com/photos/qFcH2_t5kj4", "Lucian", "Lacul Bucura, Retezat"),
};

export const photoSrc = (photo: Photo, width: number) => `https://images.unsplash.com/${photo.id}?auto=format&fit=crop&w=${width}&q=80`;
export const photoSrcSet = (photo: Photo, widths = [480, 800, 1200, 1600]) => widths.map((w) => `${photoSrc(photo, w)} ${w}w`).join(", ");

// Photographs used on the public site for the research stations. Location checked on each photo page.
export const STATION_PHOTOS = {
  braila: AREA_PHOTOS[2],
  "sfantu-gheorghe": make("photo-1674840967059-27c24f700a9a", "https://unsplash.com/photos/-uPvhOZmWKA", "Marian Strinoiu", "Delta Dunării"),
  sinaia: make("photo-1664616800116-f530b76e0bbe", "https://unsplash.com/photos/wLkxD8R0Ge8", "Andrei R. Popescu", "Munții Bucegi"),
  orsova: make("photo-1676037073075-914d753b3afb", "https://unsplash.com/photos/VpAk0Vcow-g", "CrowN", "Dunărea, chipul lui Decebal"),
} satisfies Record<string, Photo>;

/** Wide landscape for the home page: birds in the Danube Delta. */
export const HERO_PHOTO = make("photo-1674840967352-eaa8e8e78579", "https://unsplash.com/photos/N21UgZsxbX8", "Marian Strinoiu", "Delta Dunării");
