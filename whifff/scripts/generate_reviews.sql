-- Restore original 20 seed perfume reviews
UPDATE perfumes SET top_review = 'Like walking through a garden in spring — elegant without trying too hard.' WHERE name = 'Miss Dior Blooming Bouquet' AND brand = 'Dior';
UPDATE perfumes SET top_review = 'Addictive and bold — confidence in a bottle.' WHERE name = 'Black Opium' AND brand = 'Yves Saint Laurent';
UPDATE perfumes SET top_review = 'The compliment magnet. People will stop you on the street.' WHERE name = 'Baccarat Rouge 540' AND brand = 'Maison Francis Kurkdjian';
UPDATE perfumes SET top_review = 'A floral explosion that settles into something warm and cozy.' WHERE name = 'Flowerbomb' AND brand ILIKE 'Viktor%Rolf';
UPDATE perfumes SET top_review = 'Effortlessly chic — a white tee and gold jewelry in scent form.' WHERE name = 'Chance Eau Tendre' AND brand = 'Chanel';
UPDATE perfumes SET top_review = 'Sexy and sophisticated. The heel bottle is iconic.' WHERE name = 'Good Girl' AND brand = 'Carolina Herrera';
UPDATE perfumes SET top_review = 'Smells way more expensive than it is. Dupe energy queen.' WHERE name = 'Cloud' AND brand = 'Ariana Grande';
UPDATE perfumes SET top_review = 'Princess energy in a bottle. Feminine, soft, unforgettable.' WHERE name = 'Delina' AND brand = 'Parfums de Marly';
UPDATE perfumes SET top_review = 'Beach vacation vibes year-round. Sweet but not cloying.' WHERE name = 'Brazilian Bum Bum Cream' AND brand = 'Sol de Janeiro';
UPDATE perfumes SET top_review = 'A warm hug in perfume form. Classic for a reason.' WHERE name ILIKE 'La Vie Est Belle' AND brand ILIKE 'Lanc%me';
UPDATE perfumes SET top_review = 'The your-skin-but-better of perfumes.' WHERE name = 'Glossier You' AND brand = 'Glossier';
UPDATE perfumes SET top_review = 'Timeless. Your mom wore it, you''ll wear it, your daughter will too.' WHERE name ILIKE 'J''adore' AND brand = 'Dior';
UPDATE perfumes SET top_review = 'If vanilla had a luxury upgrade, this is it.' WHERE name ILIKE 'Kayali Vanilla%28' AND brand ILIKE 'Kayali';
UPDATE perfumes SET top_review = 'Gender-fluid energy. Lavender + vanilla is chef''s kiss.' WHERE name = 'Libre' AND brand = 'Yves Saint Laurent';
UPDATE perfumes SET top_review = 'Berry-licious. Sweet without being juvenile.' WHERE name ILIKE 'Burberry Her' AND brand = 'Burberry';
UPDATE perfumes SET top_review = 'Warm, yummy, and totally addictive.' WHERE name ILIKE 'Cheirosa 71' AND brand ILIKE 'Sol de Janeiro';
UPDATE perfumes SET top_review = 'The most sophisticated thing you can spray on yourself.' WHERE name = 'Coco Mademoiselle' AND brand = 'Chanel';
UPDATE perfumes SET top_review = 'Minimalist and magnetic. One molecule and it''s magic.' WHERE name = 'Not a Perfume' AND brand = 'Juliette Has a Gun';
UPDATE perfumes SET top_review = 'Elegant and understated. Lavender-vanilla heaven.' WHERE name = 'Mon Guerlain' AND brand = 'Guerlain';
UPDATE perfumes SET top_review = 'Fresh, girly, and easygoing. The ultimate first perfume.' WHERE name = 'Daisy' AND brand = 'Marc Jacobs';

-- Generate short descriptions for all perfumes that still have empty reviews
-- Uses the first 3 accords to create a natural-sounding description
UPDATE perfumes
SET top_review = CONCAT(
  INITCAP(accords[1]),
  CASE WHEN array_length(accords, 1) >= 3
    THEN CONCAT(', ', accords[2], ', and ', accords[3])
    WHEN array_length(accords, 1) = 2
    THEN CONCAT(' and ', accords[2])
    ELSE ''
  END,
  ' — ',
  CASE
    WHEN 'sweet' = ANY(accords) OR 'vanilla' = ANY(accords) OR 'gourmand' = ANY(accords)
      THEN 'a cozy, inviting scent.'
    WHEN 'fresh' = ANY(accords) OR 'citrus' = ANY(accords) OR 'aquatic' = ANY(accords)
      THEN 'clean and effortless.'
    WHEN 'woody' = ANY(accords) OR 'leather' = ANY(accords) OR 'smoky' = ANY(accords)
      THEN 'bold and grounding.'
    WHEN 'floral' = ANY(accords) OR 'rose' = ANY(accords) OR 'white floral' = ANY(accords)
      THEN 'feminine and timeless.'
    WHEN 'warm spicy' = ANY(accords) OR 'amber' = ANY(accords) OR 'oriental' = ANY(accords)
      THEN 'warm and captivating.'
    WHEN 'fruity' = ANY(accords)
      THEN 'playful and bright.'
    WHEN 'musky' = ANY(accords) OR 'powdery' = ANY(accords)
      THEN 'soft and skin-like.'
    ELSE 'a unique blend worth discovering.'
  END
)
WHERE top_review IS NULL OR top_review = '';
