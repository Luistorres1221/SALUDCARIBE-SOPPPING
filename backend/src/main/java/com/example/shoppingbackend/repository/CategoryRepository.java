package com.example.shoppingbackend.repository;

import com.example.shoppingbackend.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
}