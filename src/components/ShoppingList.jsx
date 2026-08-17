import React, { useState } from 'react';

/**
 * Shopping List Component
 * Generates ingredient-based shopping list from routine
 */
export function ShoppingList({ routine }) {
  const [checkedItems, setCheckedItems] = useState({});
  const [pricePreference, setPricePreference] = useState('mid'); // budget, mid, luxury

  if (!routine) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">Generate a routine first to see your shopping list.</p>
      </div>
    );
  }

  // Extract ingredients from routine
  const ingredients = extractIngredients(routine);

  const toggleItem = (index) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleExport = (format) => {
    const list = ingredients
      .map((ing, idx) => `${checkedItems[idx] ? '✓' : '○'} ${ing.name} - ${ing.price[pricePreference]}`)
      .join('\n');

    if (format === 'clipboard') {
      navigator.clipboard.writeText(list);
      alert('Shopping list copied to clipboard!');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Shopping List</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('clipboard')}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Copy List
          </button>
        </div>
      </div>

      {/* Price Preference */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Price Preference:</label>
        <div className="flex gap-2">
          {['budget', 'mid', 'luxury'].map((pref) => (
            <button
              key={pref}
              onClick={() => setPricePreference(pref)}
              className={`px-3 py-1 rounded-lg text-sm ${
                pricePreference === pref
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {pref.charAt(0).toUpperCase() + pref.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredient Groups */}
      <div className="space-y-4">
        {Object.entries(groupByCategory(ingredients)).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
              <span className="mr-2">{getCategoryIcon(category)}</span>
              {category}
            </h3>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-3 flex items-start gap-3 cursor-pointer transition ${
                    checkedItems[index]
                      ? 'bg-green-50 border-green-300'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => toggleItem(index)}
                >
                  <input
                    type="checkbox"
                    checked={checkedItems[index] || false}
                    onChange={() => toggleItem(index)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.benefit}</p>
                    <p className="text-xs text-blue-600 mt-1">{item.price[pricePreference]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 mb-2">💡 Shopping Tips</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Look for these concentrations in products: Retinol 0.2-0.5%, Niacinamide 5-10%, Vitamin C 10-15%</li>
          <li>• Start with lower concentrations and gradually increase</li>
          <li>• Check ingredient lists - avoid alcohol, fragrance, and parabens if you have sensitive skin</li>
          <li>• Buy from authorized retailers to ensure authenticity</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Extract ingredients from routine
 */
function extractIngredients(routine) {
  const ingredients = [];

  const processSteps = (steps) => {
    steps.forEach((step) => {
      if (step.ingredient) {
        ingredients.push({
          name: step.ingredient,
          category: getCategory(step.step),
          benefit: getBenefit(step.ingredient),
          price: getPriceRange(step.ingredient),
        });
      }
    });
  };

  processSteps(routine.morning);
  processSteps(routine.evening);

  // Remove duplicates
  const unique = ingredients.filter(
    (ing, index, self) => index === self.findIndex((i) => i.name === ing.name)
  );

  return unique;
}

function getCategory(step) {
  if (step.includes('Cleanser')) return 'Cleansers';
  if (step.includes('Toner')) return 'Toners';
  if (step.includes('Serum') || step.includes('Treatment')) return 'Actives';
  if (step.includes('Moisturizer')) return 'Moisturizers';
  if (step.includes('Sunscreen')) return 'SPF';
  return 'Other';
}

function getCategoryIcon(category) {
  const icons = {
    Cleansers: '🧴',
    Toners: '💧',
    Actives: '⚡',
    Moisturizers: '🌿',
    SPF: '☀️',
    Other: '✨',
  };
  return icons[category] || '✨';
}

function groupByCategory(ingredients) {
  return ingredients.reduce((acc, ing) => {
    if (!acc[ing.category]) acc[ing.category] = [];
    acc[ing.category].push(ing);
    return acc;
  }, {});
}

function getBenefit(ingredient) {
  const benefits = {
    'Vitamin C': 'Brightens skin, builds collagen',
    'Retinol': 'Anti-aging, reduces wrinkles',
    'Niacinamide': 'Regulates oil, minimizes pores',
    'Hyaluronic Acid': 'Hydrates and plumps skin',
    'Salicylic Acid': 'Unclogs pores, treats acne',
    'Benzoyl Peroxide': 'Kills acne bacteria',
    'Azelaic Acid': 'Reduces redness and inflammation',
    'Centella Asiatica': 'Soothes and heals',
    'Peptides': 'Strengthens skin structure',
  };
  return benefits[ingredient] || 'Improves skin health';
}

function getPriceRange(ingredient) {
  const prices = {
    'Vitamin C': { budget: '$8-15', mid: '$15-30', luxury: '$30-60' },
    'Retinol': { budget: '$6-12', mid: '$12-25', luxury: '$25-50' },
    'Niacinamide': { budget: '$5-10', mid: '$10-20', luxury: '$20-40' },
    'Hyaluronic Acid': { budget: '$7-12', mid: '$12-25', luxury: '$25-50' },
    'Salicylic Acid': { budget: '$5-10', mid: '$10-18', luxury: '$18-35' },
    'Benzoyl Peroxide': { budget: '$4-8', mid: '$8-15', luxury: '$15-25' },
    'Azelaic Acid': { budget: '$10-15', mid: '$15-30', luxury: '$30-50' },
    'Centella Asiatica': { budget: '$8-12', mid: '$12-20', luxury: '$20-40' },
    'Peptides': { budget: '$12-18', mid: '$18-35', luxury: '$35-70' },
  };
  return prices[ingredient] || { budget: '$10-15', mid: '$15-25', luxury: '$25-40' };
}