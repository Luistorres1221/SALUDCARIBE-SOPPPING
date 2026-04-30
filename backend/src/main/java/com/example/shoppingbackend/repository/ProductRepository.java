package com.example.shoppingbackend.repository;

import com.example.shoppingbackend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
}