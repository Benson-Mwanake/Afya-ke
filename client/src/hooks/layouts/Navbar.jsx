// src/layouts/Navbar.jsx

import React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-xl font-bold text-green-600">
              <span className="text-gray-900">Afya</span>Link
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/about"
              className="text-gray-600 hover:text-green-600 transition duration-150"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-gray-600 hover:text-green-600 transition duration-150"
            >
              Contact
            </Link>

            {/* Login Link */}
            <Link
              to="/login"
              className="text-gray-600 hover:text-green-600 transition duration-150"
            >
              Login
            </Link>

            {/* Register Button */}
            <Link
              to="/signup"
              className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition duration-150 shadow-md"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
