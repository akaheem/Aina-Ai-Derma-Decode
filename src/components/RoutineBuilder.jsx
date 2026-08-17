import React, { useState, useEffect } from 'react';
import { getIngredientGuidance } from '../data/ingredients';

/**
 * Routine Builder Component
 * Generates personalized AM/PM/Weekly skincare routines based on skin analysis
 */
export function RoutineBuilder({ analysis }) {
  const [routine, setRoutine] = useState(null);
  const [selectedConcerns, setSelectedConcerns] = useState([]);

  useEffect(() => {
    if (!analysis) return;

    // Identify top concerns (scores >= 50)
    const concerns = [];
    if (analysis.wrinkles >= 50) concerns.push({ key: 'wrinkles', value: analysis.wrinkles });
    if (analysis.redness >= 50) concerns.push({ key: 'redness', value: analysis.redness });
    if (analysis.oiliness >= 50) concerns.push({ key: 'oiliness', value: analysis.oiliness });
    if (analysis.acne >= 50) concerns.push({ key: 'acne', value: analysis.acne });
    if (analysis.dark_circles >= 50) concerns.push({ key: 'dark_circles', value: analysis.dark_circles });

    // Sort by severity
    concerns.sort((a, b) => b.value - a.value);
    setSelectedConcerns(concerns);

    // Generate routine based on top 2 concerns
    const primaryConcern = concerns[0]?.key || 'wrinkles';
    const secondaryConcern = concerns[1]?.key || 'oiliness';

    const generatedRoutine = generateRoutine(primaryConcern, secondaryConcern);
    setRoutine(generatedRoutine);
  }, [analysis]);

  if (!analysis) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">Analyze your skin first to generate a personalized routine.</p>
      </div>
    );
  }

  if (!routine) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Personalized Routine</h2>

        {/* Top Concerns */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Top Concerns Addressed:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedConcerns.map((concern) => (
              <span
                key={concern.key}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {concern.key.replace('_', ' ')} ({concern.value}%)
              </span>
            ))}
          </div>
        </div>

        {/* Morning Routine */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <span className="text-2xl mr-2">☀️</span> Morning Routine
            <span className="text-sm text-gray-500 ml-2">~2 minutes</span>
          </h3>
          <div className="space-y-3">
            {routine.morning.map((step, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{step.step}</h4>
                    <p className="text-sm text-gray-600 mt-1">{step.product}</p>
                    {step.ingredient && (
                      <p className="text-xs text-blue-600 mt-1">Key ingredient: {step.ingredient}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{step.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evening Routine */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <span className="text-2xl mr-2">🌙</span> Evening Routine
            <span className="text-sm text-gray-500 ml-2">~5 minutes</span>
          </h3>
          <div className="space-y-3">
            {routine.evening.map((step, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{step.step}</h4>
                    <p className="text-sm text-gray-600 mt-1">{step.product}</p>
                    {step.ingredient && (
                      <p className="text-xs text-blue-600 mt-1">Key ingredient: {step.ingredient}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{step.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Treatments */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <span className="text-2xl mr-2">📅</span> Weekly Treatments
            <span className="text-sm text-gray-500 ml-2">~15 minutes</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {routine.weekly.map((treatment, index) => (
              <div key={index} className="border border-purple-200 bg-purple-50 rounded-lg p-3">
                <h4 className="font-semibold text-purple-800">{treatment.type}</h4>
                <p className="text-sm text-purple-600 mt-1">{treatment.frequency}</p>
                {treatment.note && (
                  <p className="text-xs text-purple-500 mt-1">{treatment.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">💡 Pro Tips</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Introduce one new product at a time, wait 2 weeks before adding another</li>
            <li>• Always patch test new products on your inner arm for 24 hours</li>
            <li>• Use sunscreen daily, even when staying indoors</li>
            <li>• Hydrate well - drink at least 8 glasses of water daily</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Generate routine based on skin concerns
 */
function generateRoutine(primaryConcern, secondaryConcern) {
  const routines = {
    wrinkles: {
      morning: [
        { step: 'Cleanser', product: 'Gentle hydrating cleanser', time: '30s' },
        { step: 'Toner', product: 'Hydrating toner with hyaluronic acid', time: '10s' },
        { step: 'Serum', product: 'Vitamin C serum (10-15%)', ingredient: 'Vitamin C', time: '30s' },
        { step: 'Moisturizer', product: 'Lightweight moisturizer with peptides', ingredient: 'Peptides', time: '30s' },
        { step: 'Sunscreen', product: 'Broad-spectrum SPF 30-50', time: '30s' },
      ],
      evening: [
        { step: 'Cleanser', product: 'Gentle cleanser to remove makeup/SPF', time: '30s' },
        { step: 'Treatment', product: 'Retinol serum (0.2-0.5%)', ingredient: 'Retinol', time: '30s' },
        { step: 'Moisturizer', product: 'Rich night cream with ceramides', time: '30s' },
      ],
      weekly: [
        { type: 'Exfoliation', frequency: '2x per week', note: 'Use AHA (glycolic acid) or gentle enzyme peel' },
        { type: 'Hydrating Mask', frequency: '1x per week', note: 'Hyaluronic acid or aloe-based' },
      ],
    },
    redness: {
      morning: [
        { step: 'Cleanser', product: 'Fragrance-free gentle cleanser', time: '30s' },
        { step: 'Toner', product: 'Soothing toner with Centella Asiatica', ingredient: 'Centella Asiatica', time: '10s' },
        { step: 'Serum', product: 'Azelaic acid serum (10%)', ingredient: 'Azelaic Acid', time: '30s' },
        { step: 'Moisturizer', product: 'Barrier-repair moisturizer with ceramides', time: '30s' },
        { step: 'Sunscreen', product: 'Mineral sunscreen (zinc oxide)', time: '30s' },
      ],
      evening: [
        { step: 'Cleanser', product: 'Cream cleanser for sensitive skin', time: '30s' },
        { step: 'Treatment', product: 'Niacinamide serum (5%)', ingredient: 'Niacinamide', time: '30s' },
        { step: 'Moisturizer', product: 'Calming night cream with allantoin', time: '30s' },
      ],
      weekly: [
        { type: 'Soothing Mask', frequency: '1x per week', note: 'Aloe vera or chamomile-based' },
        { type: 'Barrier Repair', frequency: '2x per week', note: 'Ceramide-rich overnight mask' },
      ],
    },
    oiliness: {
      morning: [
        { step: 'Cleanser', product: 'Gel cleanser with salicylic acid', ingredient: 'Salicylic Acid', time: '30s' },
        { step: 'Toner', product: 'Niacinamide toner (5-10%)', ingredient: 'Niacinamide', time: '10s' },
        { step: 'Serum', product: 'Lightweight vitamin C serum', time: '30s' },
        { step: 'Moisturizer', product: 'Oil-free gel moisturizer', time: '30s' },
        { step: 'Sunscreen', product: 'Matte-finish SPF 30', time: '30s' },
      ],
      evening: [
        { step: 'Cleanser', product: 'Oil-control cleanser', time: '30s' },
        { step: 'Treatment', product: 'Retinol serum (0.2%)', ingredient: 'Retinol', time: '30s' },
        { step: 'Moisturizer', product: 'Lightweight night gel', time: '30s' },
      ],
      weekly: [
        { type: 'Exfoliation', frequency: '2x per week', note: 'BHA (salicylic acid) for deep pore cleaning' },
        { type: 'Clay Mask', frequency: '1x per week', note: 'Kaolin clay to absorb excess oil' },
      ],
    },
    acne: {
      morning: [
        { step: 'Cleanser', product: 'Salicylic acid cleanser', ingredient: 'Salicylic Acid', time: '30s' },
        { step: 'Toner', product: 'BHA toner', time: '10s' },
        { step: 'Treatment', product: 'Benzoyl peroxide (2.5-5%)', ingredient: 'Benzoyl Peroxide', time: '30s' },
        { step: 'Moisturizer', product: 'Oil-free moisturizer', time: '30s' },
        { step: 'Sunscreen', product: 'Non-comedogenic SPF', time: '30s' },
      ],
      evening: [
        { step: 'Cleanser', product: 'Gentle cleanser', time: '30s' },
        { step: 'Treatment', product: 'Adapalene gel (0.1%)', ingredient: 'Adapalene', time: '30s' },
        { step: 'Moisturizer', product: 'Lightweight night moisturizer', time: '30s' },
      ],
      weekly: [
        { type: 'Exfoliation', frequency: '2x per week', note: 'Alternate between AHA and BHA' },
        { type: 'Purifying Mask', frequency: '1x per week', note: 'Clay or sulfur-based mask' },
      ],
    },
    dark_circles: {
      morning: [
        { step: 'Cleanser', product: 'Gentle cleanser', time: '30s' },
        { step: 'Eye Cream', product: 'Vitamin C eye cream', ingredient: 'Vitamin C', time: '30s' },
        { step: 'Serum', product: 'Brightening serum with niacinamide', time: '30s' },
        { step: 'Moisturizer', product: 'Lightweight moisturizer', time: '30s' },
        { step: 'Sunscreen', product: 'SPF 30-50', time: '30s' },
      ],
      evening: [
        { step: 'Cleanser', product: 'Gentle cleanser', time: '30s' },
        { step: 'Eye Treatment', product: 'Retinol eye cream (0.1%)', ingredient: 'Retinol', time: '30s' },
        { step: 'Moisturizer', product: 'Night cream with peptides', time: '30s' },
      ],
      weekly: [
        { type: 'Eye Mask', frequency: '2x per week', note: 'Caffeine or vitamin C under-eye patches' },
        { type: 'Brightening Treatment', frequency: '1x per week', note: 'AHA or enzyme-based brightening' },
      ],
    },
  };

  // Combine primary and secondary concerns
  const primaryRoutine = routines[primaryConcern] || routines.wrinkles;
  const secondaryRoutine = routines[secondaryConcern];

  // If different concerns, merge treatments
  if (secondaryRoutine && primaryConcern !== secondaryConcern) {
    return {
      morning: [...primaryRoutine.morning.slice(0, 4), ...secondaryRoutine.morning.slice(2, 3), primaryRoutine.morning[4]],
      evening: [...primaryRoutine.evening.slice(0, 2), ...secondaryRoutine.evening.slice(1, 2), primaryRoutine.evening[2]],
      weekly: [...primaryRoutine.weekly, ...secondaryRoutine.weekly.slice(0, 1)],
    };
  }

  return primaryRoutine;
}