import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { extractAffiliateParams, storeAffiliateData, getStoredAffiliateData } from '../utils/affiliate';

// Cart actions
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  SET_AFFILIATE: 'SET_AFFILIATE',
  LOAD_CART: 'LOAD_CART'
};

// Initial state
const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
  affiliateId: null,
  affiliateCode: null
};

// Cart reducer
function cartReducer(state, action) {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      
      if (existingItem) {
        // Update quantity if item already exists
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return {
          ...state,
          items: updatedItems,
          ...calculateTotals(updatedItems)
        };
      } else {
        // Add new item
        const newItems = [...state.items, { ...action.payload, quantity: 1 }];
        return {
          ...state,
          items: newItems,
          ...calculateTotals(newItems)
        };
      }
    }

    case CART_ACTIONS.REMOVE_ITEM: {
      const newItems = state.items.filter(item => item.id !== action.payload);
      return {
        ...state,
        items: newItems,
        ...calculateTotals(newItems)
      };
    }

    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        const newItems = state.items.filter(item => item.id !== id);
        return {
          ...state,
          items: newItems,
          ...calculateTotals(newItems)
        };
      }

      const updatedItems = state.items.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
      return {
        ...state,
        items: updatedItems,
        ...calculateTotals(updatedItems)
      };
    }

    case CART_ACTIONS.CLEAR_CART:
      return {
        ...initialState,
        affiliateId: state.affiliateId,
        affiliateCode: state.affiliateCode
      };

    case CART_ACTIONS.SET_AFFILIATE:
      return {
        ...state,
        affiliateId: action.payload.id,
        affiliateCode: action.payload.code
      };

    case CART_ACTIONS.LOAD_CART:
      return {
        ...action.payload,
        ...calculateTotals(action.payload.items || [])
      };

    default:
      return state;
  }
}

// Helper function to calculate totals
function calculateTotals(items) {
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const total = items.reduce((total, item) => {
    const price = parseFloat(item.price.replace(/[^\d]/g, ''));
    return total + (price * item.quantity);
  }, 0);

  return { itemCount, total };
}

// Create context
const CartContext = createContext();

// Cart provider component
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: parsedCart });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }

    // Check for affiliate parameters in URL
    const affiliateParams = extractAffiliateParams(window.location.href);

    if (affiliateParams.id || affiliateParams.code) {
      // Store affiliate data for future use
      storeAffiliateData(affiliateParams);

      dispatch({
        type: CART_ACTIONS.SET_AFFILIATE,
        payload: affiliateParams
      });
    } else {
      // Check for stored affiliate data
      const storedAffiliate = getStoredAffiliateData();
      if (storedAffiliate) {
        dispatch({
          type: CART_ACTIONS.SET_AFFILIATE,
          payload: storedAffiliate
        });
      }
    }
  }, []);

  // Save cart to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state));
  }, [state]);

  // Cart actions
  const addItem = (item) => {
    dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: item });
  };

  const removeItem = (itemId) => {
    dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: itemId });
  };

  const updateQuantity = (itemId, quantity) => {
    dispatch({ type: CART_ACTIONS.UPDATE_QUANTITY, payload: { id: itemId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  };

  const setAffiliate = (affiliateId, affiliateCode) => {
    dispatch({ 
      type: CART_ACTIONS.SET_AFFILIATE, 
      payload: { id: affiliateId, code: affiliateCode } 
    });
  };

  const value = {
    ...state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setAffiliate
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
