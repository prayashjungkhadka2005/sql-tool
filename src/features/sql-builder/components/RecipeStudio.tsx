import { QueryState } from "@/features/sql-builder/types";
import { ALL_RECIPES, SQLRecipe } from "@/features/sql-builder/data/recipe-definitions";
import { useState, useRef } from "react";
import RecipeCustomizer from "./RecipeCustomizer";

interface RecipeStudioProps {
  onLoadRecipe: (state: Partial<QueryState>) => void;
  currentTable?: string;
}

export default function RecipeStudio({ onLoadRecipe, currentTable }: RecipeStudioProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<SQLRecipe | null>(null);
  
  // Store button ref for focus restoration (must be at top before any returns)
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  
  const allRecipes = ALL_RECIPES;
  
  // Unified style matching existing UI
  const recipeStyle = {
    bg: "bg-foreground/5",
    border: "border-foreground/10",
    icon: "text-foreground/60",
    hover: "hover:bg-foreground/10",
  };

  const handleRecipeClick = (recipe: SQLRecipe) => {
    setSelectedRecipe(recipe);
  };

  const handleCustomizerClose = () => {
    const recipeId = selectedRecipe?.id;
    setSelectedRecipe(null);
    
    // Restore focus to the button that opened the modal
    if (recipeId && buttonRefs.current.has(recipeId)) {
      setTimeout(() => {
        buttonRefs.current.get(recipeId)?.focus();
      }, 100);
    }
  };

  const handleLoadCustomizedRecipe = (queryState: Partial<QueryState>) => {
    onLoadRecipe(queryState);
    setSelectedRecipe(null);
  };
  
  // Handle empty state (after all hooks)
  if (allRecipes.length === 0) {
    return (
      <div className="mb-8">
        <div className="relative p-5 sm:p-6 bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg">
          <div className="text-center py-8">
            <p className="text-sm text-foreground/40 font-mono">
              No recipes available
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        {/* Clean Backend Style */}
        <div className="relative p-5 sm:p-6 bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg">
          {/* Header */}
          <div className="mb-5 pb-4 border-b border-foreground/10">
            <div className="flex items-center gap-2.5 mb-2">
              <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                SQL Recipe Studio
              </h3>
            </div>
            <p className="text-xs text-foreground/40 font-mono">
              → interactive patterns • customize for your data
            </p>
          </div>

          {/* Recipe Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {(isExpanded ? allRecipes : allRecipes.slice(0, 4)).map((recipe) => (
              <button
                key={recipe.id}
                ref={(el) => {
                  if (el) buttonRefs.current.set(recipe.id, el);
                  else buttonRefs.current.delete(recipe.id);
                }}
                onClick={() => handleRecipeClick(recipe)}
                className={`group relative p-4 bg-[#fafafa] dark:bg-black/40 border ${recipeStyle.border} ${recipeStyle.hover} hover:border-foreground/20 active:scale-95 active:bg-foreground/10 rounded transition-all text-left`}
                aria-label={`${recipe.name} - ${recipe.difficulty} - ${recipe.description}`}
                title={recipe.description}
              >
                {/* Difficulty Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    recipe.difficulty === "Beginner" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                    recipe.difficulty === "Intermediate" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                    recipe.difficulty === "Advanced" ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" :
                    "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  }`}>
                    {recipe.difficulty}
                  </span>
                </div>

                <div className="relative">
                  <div className={`inline-flex w-9 h-9 rounded border ${recipeStyle.border} items-center justify-center mb-3 ${recipeStyle.icon}`}>
                    {recipe.icon}
                  </div>
                  <h4 className="text-xs font-semibold text-foreground mb-1 font-mono">
                    {recipe.name}
                  </h4>
                  <p className="text-[10px] text-foreground/50 font-mono leading-relaxed">
                    {recipe.description}
                  </p>
                </div>

                {/* Category Badge */}
                <div className="mt-3 pt-3 border-t border-foreground/5">
                  <span className="text-[10px] font-mono text-foreground/40 uppercase tracking-wide">
                    {recipe.category}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Show More/Less Button */}
          {allRecipes.length > 4 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-4 py-2 bg-foreground/5 hover:bg-foreground/10 active:bg-foreground/15 active:scale-95 border border-foreground/10 hover:border-foreground/20 text-foreground rounded-lg transition-all flex items-center gap-2 mx-auto text-xs font-mono"
                aria-label={isExpanded ? 'Show less recipes' : `Show all ${allRecipes.length} recipes`}
                aria-expanded={isExpanded}
              >
                <span>{isExpanded ? 'Show Less' : `Show All ${allRecipes.length} Recipes`}</span>
                <svg 
                  className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recipe Customizer Modal */}
      {selectedRecipe && (
        <RecipeCustomizer
          recipe={selectedRecipe}
          currentTable={currentTable}
          onClose={handleCustomizerClose}
          onLoadRecipe={handleLoadCustomizedRecipe}
        />
      )}
    </>
  );
}

