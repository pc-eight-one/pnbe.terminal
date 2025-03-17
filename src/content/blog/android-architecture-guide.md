---
title: 'Modern Multi-Screen Android Architecture Guide Using Java'
description: 'Learn how to work with Android app architecture, including UI, presentation, domain, and data layers, using Java.'
pubDate: '2025-03-16'
tags: ['android', 'java', 'architecture', 'mvvm', 'clean-architecture', 'room', 'retrofit']
id: 'b25250316'
---
# Modern Multi-Screen Android Architecture Guide Using Java

## Introduction

This guide explores the architecture for building robust, maintainable, and testable multi-screen Android applications using Java, following modern architectural principles and design patterns. We'll cover the complete architecture from UI components to data persistence, focusing on a modular, layered approach that separates concerns and creates a clean, scalable codebase.

## Table of Contents

1. [Architectural Overview](#architectural-overview)
2. [Application Layers](#application-layers)
3. [UI Layer](#ui-layer)
   - [Activities](#activities)
   - [Fragments](#fragments)
   - [Navigation Component](#navigation-component)
4. [Presentation Layer](#presentation-layer)
   - [ViewModel](#viewmodel)
   - [LiveData](#livedata)
   - [State Management](#state-management)
5. [Domain Layer](#domain-layer)
   - [Use Cases / Interactors](#use-cases--interactors)
   - [Domain Models](#domain-models)
6. [Data Layer](#data-layer)
   - [Repository Pattern](#repository-pattern)
   - [Data Sources](#data-sources)
   - [Room Database](#room-database)
   - [Network with Retrofit](#network-with-retrofit)
7. [Dependency Injection](#dependency-injection)
8. [Navigation Between Screens](#navigation-between-screens)
9. [Error Handling](#error-handling)
10. [Testing Strategy](#testing-strategy)
11. [Complete Architecture Example](#complete-architecture-example)
12. [Best Practices](#best-practices)

## Architectural Overview

A well-designed Android application follows these key principles:

- **Separation of concerns**: Each component has specific responsibilities
- **Driving UI from data models**: UI reactively updates based on data changes
- **Single source of truth**: Data is stored and managed from one definitive source
- **Unidirectional data flow**: Data flows in one direction, making the app's behavior predictable
- **Testability**: Architecture designed to make testing straightforward at all levels

The recommended architecture follows the MVVM (Model-View-ViewModel) pattern enhanced with Clean Architecture principles:

![Architecture Diagram](https://developer.android.com/topic/libraries/architecture/images/final-architecture.png)

## Application Layers

Our architecture consists of four main layers:

1. **UI Layer**: Activities, Fragments, Views, and UI-related components
2. **Presentation Layer**: ViewModels and UI state management
3. **Domain Layer**: Business logic and use cases
4. **Data Layer**: Repositories and data sources (local/remote)

Let's explore each layer in detail.

## UI Layer

The UI layer is responsible for displaying data to the user and capturing user interactions. It consists of Activities, Fragments, and custom Views.

### Activities

In a multi-screen application, Activities typically serve as containers for Fragments rather than containing UI logic themselves.

```java
public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }
}
```

### Fragments

Fragments represent distinct screens or UI components within your app:

```java
public class ProductListFragment extends Fragment {
    private ProductViewModel viewModel;
    private ProductAdapter adapter;
    
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_product_list, container, false);
    }
    
    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        // Set up RecyclerView
        RecyclerView recyclerView = view.findViewById(R.id.product_list);
        adapter = new ProductAdapter(item -> {
            // Navigate to product detail screen when item is clicked
            navigateToProductDetail(item.getId());
        });
        recyclerView.setAdapter(adapter);
        
        // Initialize ViewModel
        viewModel = new ViewModelProvider(this).get(ProductViewModel.class);
        
        // Observe LiveData from ViewModel
        viewModel.getProducts().observe(getViewLifecycleOwner(), products -> {
            adapter.submitList(products);
        });
        
        // Observe loading state
        viewModel.getLoadingState().observe(getViewLifecycleOwner(), isLoading -> {
            // Show/hide loading indicator
            view.findViewById(R.id.progress_bar).setVisibility(
                isLoading ? View.VISIBLE : View.GONE);
        });
    }
    
    private void navigateToProductDetail(long productId) {
        Bundle args = new Bundle();
        args.putLong("productId", productId);
        
        // Using Navigation Component
        NavHostFragment.findNavController(this)
                .navigate(R.id.action_productList_to_productDetail, args);
    }
}
```

### Navigation Component

For multi-screen applications, the Navigation Component provides a framework for implementing navigation:

**nav_graph.xml**:
```xml
<?xml version="1.0" encoding="utf-8"?>
<navigation xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:id="@+id/nav_graph"
    app:startDestination="@id/productListFragment">
    
    <fragment
        android:id="@+id/productListFragment"
        android:name="com.example.app.ui.ProductListFragment"
        android:label="Products">
        <action
            android:id="@+id/action_productList_to_productDetail"
            app:destination="@id/productDetailFragment" />
    </fragment>
    
    <fragment
        android:id="@+id/productDetailFragment"
        android:name="com.example.app.ui.ProductDetailFragment"
        android:label="Product Details">
        <argument
            android:name="productId"
            app:argType="long" />
    </fragment>
</navigation>
```

## Presentation Layer

The presentation layer contains ViewModels and UI state management logic.

### ViewModel

ViewModels store and manage UI-related data, surviving configuration changes:

```java
public class ProductViewModel extends ViewModel {
    private final ProductRepository repository;
    private final MutableLiveData<List<Product>> products = new MutableLiveData<>();
    private final MutableLiveData<Boolean> isLoading = new MutableLiveData<>(false);
    
    public ProductViewModel() {
        // In real app, use dependency injection
        repository = ProductRepository.getInstance();
        loadProducts();
    }
    
    public LiveData<List<Product>> getProducts() {
        return products;
    }
    
    public LiveData<Boolean> getLoadingState() {
        return isLoading;
    }
    
    private void loadProducts() {
        isLoading.setValue(true);
        
        // Execute on a background thread
        new Thread(() -> {
            try {
                List<Product> result = repository.getProducts();
                products.postValue(result);
            } catch (Exception e) {
                // Handle error
            } finally {
                isLoading.postValue(false);
            }
        }).start();
    }
    
    public void refreshProducts() {
        loadProducts();
    }
}
```

### LiveData

LiveData is a lifecycle-aware observable data holder:

```java
// In ViewModel
private final MutableLiveData<User> userData = new MutableLiveData<>();

public LiveData<User> getUserData() {
    return userData;
}

// In Fragment or Activity
viewModel.getUserData().observe(getViewLifecycleOwner(), user -> {
    // Update UI with user data
});
```

### State Management

For more complex UIs, consider using a state object to represent the complete UI state:

```java
public class ProductListState {
    private final List<Product> products;
    private final boolean isLoading;
    private final String errorMessage;
    
    // Constructor, getters, etc.
}

// In ViewModel
private final MutableLiveData<ProductListState> uiState = new MutableLiveData<>();

public LiveData<ProductListState> getUiState() {
    return uiState;
}

// Update state
private void updateState(List<Product> newProducts, boolean loading, String error) {
    ProductListState newState = new ProductListState(newProducts, loading, error);
    uiState.setValue(newState);
}
```

## Domain Layer

The domain layer contains business logic and use cases, independent of the Android framework.

### Use Cases / Interactors

Use cases encapsulate specific business operations:

```java
public class GetProductsUseCase {
    private final ProductRepository repository;
    
    public GetProductsUseCase(ProductRepository repository) {
        this.repository = repository;
    }
    
    public List<Product> execute() throws Exception {
        return repository.getProducts();
    }
}

public class AddProductToCartUseCase {
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    
    public AddProductToCartUseCase(CartRepository cartRepository, 
                                  ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
    }
    
    public void execute(long productId, int quantity) throws Exception {
        Product product = productRepository.getProductById(productId);
        if (product != null && product.isInStock()) {
            cartRepository.addItem(product, quantity);
        } else {
            throw new OutOfStockException("Product is out of stock");
        }
    }
}
```

### Domain Models

Domain models represent core business entities:

```java
public class Product {
    private final long id;
    private final String name;
    private final String description;
    private final double price;
    private final int stockQuantity;
    
    // Constructor, getters, etc.
    
    public boolean isInStock() {
        return stockQuantity > 0;
    }
}
```

## Data Layer

The data layer handles data operations using the Repository pattern and various data sources.

### Repository Pattern

Repositories abstract the data sources and provide clean APIs to the rest of the app:

```java
public class ProductRepository {
    private final ProductRemoteDataSource remoteDataSource;
    private final ProductLocalDataSource localDataSource;
    
    public ProductRepository(ProductRemoteDataSource remoteDataSource,
                            ProductLocalDataSource localDataSource) {
        this.remoteDataSource = remoteDataSource;
        this.localDataSource = localDataSource;
    }
    
    public List<Product> getProducts() throws Exception {
        try {
            // Try to fetch fresh data from the network
            List<ProductDto> networkResult = remoteDataSource.getProducts();
            List<Product> products = mapToDomainModel(networkResult);
            
            // Cache the results locally
            localDataSource.saveProducts(products);
            
            return products;
        } catch (IOException e) {
            // Network error, try to fetch from local cache
            return localDataSource.getProducts();
        }
    }
    
    public Product getProductById(long id) throws Exception {
        try {
            ProductDto dto = remoteDataSource.getProductById(id);
            return mapToDomainModel(dto);
        } catch (IOException e) {
            // Fallback to local cache
            return localDataSource.getProductById(id);
        }
    }
    
    // Helper methods for mapping between DTOs and domain models
    private List<Product> mapToDomainModel(List<ProductDto> dtos) {
        // Mapping logic
    }
    
    private Product mapToDomainModel(ProductDto dto) {
        // Mapping logic
    }
}
```

### Data Sources

Data sources handle specific data operations:

```java
public interface ProductDataSource {
    List<ProductDto> getProducts() throws Exception;
    ProductDto getProductById(long id) throws Exception;
}

public class ProductRemoteDataSource implements ProductDataSource {
    private final ProductApiService apiService;
    
    public ProductRemoteDataSource(ProductApiService apiService) {
        this.apiService = apiService;
    }
    
    @Override
    public List<ProductDto> getProducts() throws IOException {
        Response<List<ProductDto>> response = apiService.getProducts().execute();
        if (response.isSuccessful()) {
            return response.body();
        } else {
            throw new IOException("Error fetching products: " + response.errorBody());
        }
    }
    
    @Override
    public ProductDto getProductById(long id) throws IOException {
        Response<ProductDto> response = apiService.getProductById(id).execute();
        if (response.isSuccessful()) {
            return response.body();
        } else {
            throw new IOException("Error fetching product: " + response.errorBody());
        }
    }
}

public class ProductLocalDataSource implements ProductDataSource {
    private final ProductDao productDao;
    
    public ProductLocalDataSource(ProductDao productDao) {
        this.productDao = productDao;
    }
    
    @Override
    public List<ProductDto> getProducts() {
        List<ProductEntity> entities = productDao.getAll();
        return mapToDataModel(entities);
    }
    
    @Override
    public ProductDto getProductById(long id) {
        ProductEntity entity = productDao.getById(id);
        return mapToDataModel(entity);
    }
    
    public void saveProducts(List<Product> products) {
        List<ProductEntity> entities = mapToEntityModel(products);
        productDao.insertAll(entities);
    }
    
    // Mapping methods
    private List<ProductDto> mapToDataModel(List<ProductEntity> entities) {
        // Mapping logic
    }
    
    private ProductDto mapToDataModel(ProductEntity entity) {
        // Mapping logic
    }
    
    private List<ProductEntity> mapToEntityModel(List<Product> products) {
        // Mapping logic
    }
}
```

### Room Database

Room provides an abstraction layer over SQLite for local data persistence:

**ProductEntity.java**:
```java
@Entity(tableName = "products")
public class ProductEntity {
    @PrimaryKey
    private long id;
    private String name;
    private String description;
    private double price;
    private int stockQuantity;
    
    // Constructor, getters, setters
}
```

**ProductDao.java**:
```java
@Dao
public interface ProductDao {
    @Query("SELECT * FROM products")
    List<ProductEntity> getAll();
    
    @Query("SELECT * FROM products WHERE id = :id")
    ProductEntity getById(long id);
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<ProductEntity> products);
    
    @Update
    void update(ProductEntity product);
    
    @Delete
    void delete(ProductEntity product);
}
```

**AppDatabase.java**:
```java
@Database(entities = {ProductEntity.class, UserEntity.class}, version = 1)
public abstract class AppDatabase extends RoomDatabase {
    public abstract ProductDao productDao();
    public abstract UserDao userDao();
    
    private static volatile AppDatabase INSTANCE;
    
    public static AppDatabase getInstance(Context context) {
        if (INSTANCE == null) {
            synchronized (AppDatabase.class) {
                if (INSTANCE == null) {
                    INSTANCE = Room.databaseBuilder(
                            context.getApplicationContext(),
                            AppDatabase.class,
                            "app_database")
                            .build();
                }
            }
        }
        return INSTANCE;
    }
}
```

### Network with Retrofit

Retrofit is used for making API calls:

**ProductApiService.java**:
```java
public interface ProductApiService {
    @GET("products")
    Call<List<ProductDto>> getProducts();
    
    @GET("products/{id}")
    Call<ProductDto> getProductById(@Path("id") long id);
    
    @POST("products")
    Call<ProductDto> createProduct(@Body ProductDto product);
}
```

**ProductDto.java**:
```java
public class ProductDto {
    @SerializedName("id")
    private long id;
    
    @SerializedName("name")
    private String name;
    
    @SerializedName("description")
    private String description;
    
    @SerializedName("price")
    private double price;
    
    @SerializedName("in_stock")
    private boolean inStock;
    
    // Constructor, getters, setters
}
```

**RetrofitClient.java**:
```java
public class RetrofitClient {
    private static final String BASE_URL = "https://api.example.com/";
    private static Retrofit retrofit = null;
    
    public static Retrofit getClient() {
        if (retrofit == null) {
            OkHttpClient client = new OkHttpClient.Builder()
                    .connectTimeout(60, TimeUnit.SECONDS)
                    .readTimeout(60, TimeUnit.SECONDS)
                    .addInterceptor(new HttpLoggingInterceptor().setLevel(HttpLoggingInterceptor.Level.BODY))
                    .build();
            
            retrofit = new Retrofit.Builder()
                    .baseUrl(BASE_URL)
                    .client(client)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build();
        }
        return retrofit;
    }
}
```

## Dependency Injection

For a production application, use a dependency injection framework like Dagger or Hilt to manage dependencies. For a simpler approach, you can create factory classes:

**ViewModelFactory.java**:
```java
public class ViewModelFactory implements ViewModelProvider.Factory {
    private final ProductRepository productRepository;
    
    public ViewModelFactory(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }
    
    @NonNull
    @Override
    public <T extends ViewModel> T create(@NonNull Class<T> modelClass) {
        if (modelClass.isAssignableFrom(ProductViewModel.class)) {
            return (T) new ProductViewModel(productRepository);
        }
        throw new IllegalArgumentException("Unknown ViewModel class");
    }
}
```

## Navigation Between Screens

For a multi-screen application, the Navigation Component is recommended:

**Setup in Activity**:
```java
public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        NavHostFragment navHostFragment = (NavHostFragment) getSupportFragmentManager()
                .findFragmentById(R.id.nav_host_fragment);
        NavController navController = navHostFragment.getNavController();
        
        // Set up ActionBar with NavController
        AppBarConfiguration appBarConfiguration = new AppBarConfiguration
                .Builder(navController.getGraph())
                .build();
        NavigationUI.setupActionBarWithNavController(this, navController, appBarConfiguration);
    }
    
    @Override
    public boolean onSupportNavigateUp() {
        NavController navController = Navigation.findNavController(
                this, R.id.nav_host_fragment);
        return navController.navigateUp() || super.onSupportNavigateUp();
    }
}
```

**Navigating Between Fragments**:
```java
// Navigate with arguments
Bundle args = new Bundle();
args.putLong("productId", product.getId());
NavHostFragment.findNavController(this)
        .navigate(R.id.action_productList_to_productDetail, args);

// Simple navigation
NavHostFragment.findNavController(this)
        .navigate(R.id.action_productDetail_to_cart);
```

## Error Handling

Implement a comprehensive error handling strategy:

```java
public class Result<T> {
    private final T data;
    private final Exception error;
    
    private Result(T data, Exception error) {
        this.data = data;
        this.error = error;
    }
    
    public static <T> Result<T> success(T data) {
        return new Result<>(data, null);
    }
    
    public static <T> Result<T> error(Exception error) {
        return new Result<>(null, error);
    }
    
    public boolean isSuccess() {
        return error == null;
    }
    
    public T getData() {
        return data;
    }
    
    public Exception getError() {
        return error;
    }
}

// In Repository
public Result<List<Product>> getProductsWithResult() {
    try {
        List<Product> products = getProducts();
        return Result.success(products);
    } catch (Exception e) {
        return Result.error(e);
    }
}

// In ViewModel
public void loadProductsWithErrorHandling() {
    isLoading.setValue(true);
    
    new Thread(() -> {
        Result<List<Product>> result = repository.getProductsWithResult();
        if (result.isSuccess()) {
            products.postValue(result.getData());
            error.postValue(null);
        } else {
            error.postValue(result.getError().getMessage());
        }
        isLoading.postValue(false);
    }).start();
}
```

## Testing Strategy

A good architecture makes testing easier:

**Unit Testing ViewModels**:
```java
@RunWith(JUnit4.class)
public class ProductViewModelTest {
    // Test rule for LiveData
    @Rule
    public InstantTaskExecutorRule instantTaskExecutorRule = new InstantTaskExecutorRule();
    
    private ProductRepository mockRepository;
    private ProductViewModel viewModel;
    
    @Before
    public void setup() {
        mockRepository = mock(ProductRepository.class);
        viewModel = new ProductViewModel(mockRepository);
    }
    
    @Test
    public void loadProducts_success() throws Exception {
        // Arrange
        List<Product> expectedProducts = Arrays.asList(
                new Product(1, "Product 1", "Description 1", 10.0, 5),
                new Product(2, "Product 2", "Description 2", 20.0, 10)
        );
        when(mockRepository.getProducts()).thenReturn(expectedProducts);
        
        // Act
        viewModel.loadProducts();
        
        // Assert
        verify(mockRepository).getProducts();
        assertEquals(expectedProducts, viewModel.getProducts().getValue());
        assertEquals(false, viewModel.getLoadingState().getValue());
    }
    
    @Test
    public void loadProducts_error() throws Exception {
        // Arrange
        Exception expectedException = new IOException("Network error");
        when(mockRepository.getProducts()).thenThrow(expectedException);
        
        // Act
        viewModel.loadProducts();
        
        // Assert
        verify(mockRepository).getProducts();
        assertEquals(expectedException.getMessage(), viewModel.getError().getValue());
        assertEquals(false, viewModel.getLoadingState().getValue());
    }
}
```

**Testing Repositories**:
```java
@RunWith(JUnit4.class)
public class ProductRepositoryTest {
    private ProductRemoteDataSource mockRemoteDataSource;
    private ProductLocalDataSource mockLocalDataSource;
    private ProductRepository repository;
    
    @Before
    public void setup() {
        mockRemoteDataSource = mock(ProductRemoteDataSource.class);
        mockLocalDataSource = mock(ProductLocalDataSource.class);
        repository = new ProductRepository(mockRemoteDataSource, mockLocalDataSource);
    }
    
    @Test
    public void getProducts_remoteSuccess() throws Exception {
        // Arrange
        List<ProductDto> remoteDtos = Arrays.asList(
                new ProductDto(1, "Product 1", "Description 1", 10.0, true),
                new ProductDto(2, "Product 2", "Description 2", 20.0, true)
        );
        when(mockRemoteDataSource.getProducts()).thenReturn(remoteDtos);
        
        // Act
        List<Product> products = repository.getProducts();
        
        // Assert
        verify(mockRemoteDataSource).getProducts();
        assertEquals(2, products.size());
        assertEquals(1, products.get(0).getId());
        assertEquals("Product 1", products.get(0).getName());
    }
    
    @Test
    public void getProducts_remoteFails_fallbackToLocal() throws Exception {
        // Arrange
        when(mockRemoteDataSource.getProducts()).thenThrow(new IOException("Network error"));
        
        List<ProductDto> localDtos = Arrays.asList(
                new ProductDto(1, "Product 1", "Description 1", 10.0, true)
        );
        when(mockLocalDataSource.getProducts()).thenReturn(localDtos);
        
        // Act
        List<Product> products = repository.getProducts();
        
        // Assert
        verify(mockRemoteDataSource).getProducts();
        verify(mockLocalDataSource).getProducts();
        assertEquals(1, products.size());
    }
}
```

## Complete Architecture Example

Here's how all the pieces come together in a multi-screen application:

![Complete Architecture Diagram](https://github.com/android/architecture-samples/raw/dev-todo-mvvm-live/todoapp/docs/images/architecture.png)

### Application Flow

1. User interacts with the UI (Fragment/Activity)
2. UI passes events to ViewModel
3. ViewModel executes use cases/interacts with repositories
4. Repository fetches data from local or remote data sources
5. Data flows back through the chain: Repository → ViewModel → UI
6. UI updates based on the new data

### Sample Multi-Screen Application

A typical multi-screen e-commerce app might have:

1. **Product List Screen**
   - Shows a list of products
   - Allows filtering and sorting
   - Navigate to product details on click

2. **Product Detail Screen**
   - Shows detailed product information
   - Allows adding to cart
   - Shows related products

3. **Shopping Cart Screen**
   - Shows items in cart
   - Allows changing quantities
   - Calculates total price
   - Proceeds to checkout

4. **Checkout Screen**
   - Enter shipping information
   - Select payment method
   - Complete order

Each screen would have its own Fragment, ViewModel, and potentially domain-specific use cases, all sharing common repositories and data sources.

## Best Practices

1. **Use Single-Activity Architecture**
   - One main activity with multiple fragments
   - Use Navigation Component for transitions

2. **ViewModels Should Be Independent**
   - Don't share ViewModels between unrelated screens
   - Use SavedStateHandle for process death

3. **Repository as Single Source of Truth**
   - All data operations go through repositories
   - Repositories decide which data source to use

4. **Room for Local Persistence**
   - Use Room for structured data storage
   - Define clear entities and relations

5. **Main Thread Safety**
   - Use background threads or coroutines for I/O operations
   - Update LiveData on main thread

6. **Clear Separation Between Layers**
   - UI layer shouldn't know about data sources
   - Domain layer shouldn't depend on Android

7. **Use DTOs for Network/Database**
   - Separate data models for network/database
   - Map to domain models in repositories

8. **Error Handling Strategy**
   - Define clear error types
   - Provide user-friendly error messages

9. **Unit Tests for Each Layer**
   - Test ViewModels, repositories, and use cases independently
   - Use mock dependencies for isolation

10. **UI Testing for Critical Flows**
    - Test end-to-end user journeys
    - Verify UI behavior and navigation

By following these architecture patterns and best practices, you can build a robust, maintainable, and testable multi-screen Android application that can scale with your requirements.
