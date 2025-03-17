---
title: 'Android REST API Calls with Progress Indicators: A Complete Guide'
description: 'Learn how to make API calls from and Android app and use progress indicators.'
pubDate: '2025-03-16'
tags: ['android', 'rest-api', 'retrofit', 'volley', 'rxjava', 'java']
id: c20250316
---
# Android REST API Calls with Progress Indicators: A Complete Guide

## Introduction

Making network requests to fetch data from a remote server is a fundamental aspect of most modern Android applications. Properly handling these requests while providing visual feedback to users through progress indicators is essential for a positive user experience.

This tutorial covers:
- Different approaches for making REST API calls in Android
- Implementing progress indicators during network operations
- Best practices for error handling and response processing
- Structuring your code for maintainability and testability

## Table of Contents

1. [Understanding REST API Calls in Android](#understanding-rest-api-calls-in-android)
2. [Setting Up the Project](#setting-up-the-project)
3. [Approach 1: Using Retrofit with Callbacks](#approach-1-using-retrofit-with-callbacks)
4. [Approach 2: Using Retrofit with RxJava](#approach-2-using-retrofit-with-rxjava)
5. [Approach 3: Using Retrofit with Coroutines (Kotlin)](#approach-3-using-retrofit-with-coroutines-kotlin)
6. [Approach 4: Using Volley](#approach-4-using-volley)
7. [Different Types of Progress Indicators](#different-types-of-progress-indicators)
8. [Implementing a Loading State Pattern](#implementing-a-loading-state-pattern)
9. [Handling Configuration Changes](#handling-configuration-changes)
10. [Caching Strategies](#caching-strategies)
11. [Comprehensive Example](#comprehensive-example)
12. [Best Practices](#best-practices)
13. [Conclusion](#conclusion)

## Understanding REST API Calls in Android

REST (Representational State Transfer) is an architectural style for designing networked applications. RESTful APIs use HTTP requests to perform CRUD (Create, Read, Update, Delete) operations on resources.

In Android, you have several options for making REST API calls:

1. **Retrofit**: A type-safe HTTP client that simplifies API communication
2. **Volley**: A networking library by Google that makes networking faster and easier
3. **OkHttp**: A powerful HTTP client that can be used directly or as the foundation for other libraries
4. **HttpURLConnection**: The basic Java API for HTTP connections

For modern Android development, Retrofit has become the de facto standard due to its type safety, ease of use, and extensive features. It uses OkHttp under the hood for efficient HTTP operations.

## Setting Up the Project

Let's start by setting up a basic Android project with the necessary dependencies:

### Add Permissions

In your `AndroidManifest.xml`, add the internet permission:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.restapidemo">

    <uses-permission android:name="android.permission.INTERNET" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        <!-- Activities go here -->
    </application>
</manifest>
```

### Add Dependencies

In your app-level `build.gradle` file, add the following dependencies:

```gradle
dependencies {
    // Retrofit
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    
    // OkHttp Logging Interceptor for debugging
    implementation 'com.squareup.okhttp3:logging-interceptor:4.9.1'
    
    // Gson for JSON parsing
    implementation 'com.google.code.gson:gson:2.8.8'
    
    // Optional: RxJava for reactive programming
    implementation 'io.reactivex.rxjava3:rxjava:3.1.0'
    implementation 'io.reactivex.rxjava3:rxandroid:3.0.0'
    implementation 'com.squareup.retrofit2:adapter-rxjava3:2.9.0'
    
    // Optional: Volley
    implementation 'com.android.volley:volley:1.2.1'
}
```

## Approach 1: Using Retrofit with Callbacks

Retrofit with callbacks is the simplest approach for handling REST API calls.

### Step 1: Define the Data Model

Create a class to represent the data you'll receive from the API:

```java
public class User {
    private int id;
    private String name;
    private String email;
    
    // Getters and setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
```

### Step 2: Define the API Interface

```java
public interface ApiService {
    @GET("users")
    Call<List<User>> getUsers();
    
    @GET("users/{userId}")
    Call<User> getUser(@Path("userId") int userId);
    
    @POST("users")
    Call<User> createUser(@Body User user);
}
```

### Step 3: Create the Retrofit Instance

Create a singleton class to manage the Retrofit instance:

```java
public class RetrofitClient {
    private static final String BASE_URL = "https://api.example.com/";
    private static RetrofitClient instance;
    private final Retrofit retrofit;
    
    private RetrofitClient() {
        OkHttpClient.Builder httpClient = new OkHttpClient.Builder();
        
        // Add logging interceptor for debugging
        HttpLoggingInterceptor loggingInterceptor = new HttpLoggingInterceptor();
        loggingInterceptor.setLevel(HttpLoggingInterceptor.Level.BODY);
        httpClient.addInterceptor(loggingInterceptor);
        
        retrofit = new Retrofit.Builder()
                .baseUrl(BASE_URL)
                .addConverterFactory(GsonConverterFactory.create())
                .client(httpClient.build())
                .build();
    }
    
    public static synchronized RetrofitClient getInstance() {
        if (instance == null) {
            instance = new RetrofitClient();
        }
        return instance;
    }
    
    public ApiService getApiService() {
        return retrofit.create(ApiService.class);
    }
}
```

### Step 4: Make API Calls with Progress Indicator

Now, let's create an Activity that makes an API call and shows a progress indicator:

```java
public class MainActivity extends AppCompatActivity {
    private ProgressBar progressBar;
    private RecyclerView recyclerView;
    private UserAdapter adapter;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        progressBar = findViewById(R.id.progressBar);
        recyclerView = findViewById(R.id.recyclerView);
        
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        adapter = new UserAdapter();
        recyclerView.setAdapter(adapter);
        
        fetchUsers();
    }
    
    private void fetchUsers() {
        // Show progress bar
        progressBar.setVisibility(View.VISIBLE);
        
        ApiService apiService = RetrofitClient.getInstance().getApiService();
        Call<List<User>> call = apiService.getUsers();
        
        call.enqueue(new Callback<List<User>>() {
            @Override
            public void onResponse(Call<List<User>> call, Response<List<User>> response) {
                // Hide progress bar
                progressBar.setVisibility(View.GONE);
                
                if (response.isSuccessful() && response.body() != null) {
                    List<User> users = response.body();
                    adapter.setUsers(users);
                } else {
                    handleErrorResponse(response);
                }
            }
            
            @Override
            public void onFailure(Call<List<User>> call, Throwable t) {
                // Hide progress bar
                progressBar.setVisibility(View.GONE);
                
                // Handle network error
                Toast.makeText(MainActivity.this, 
                        "Network error: " + t.getMessage(), 
                        Toast.LENGTH_LONG).show();
            }
        });
    }
    
    private void handleErrorResponse(Response<List<User>> response) {
        String errorMessage;
        try {
            errorMessage = response.errorBody() != null ? 
                    response.errorBody().string() : "Unknown error";
        } catch (IOException e) {
            errorMessage = "Error parsing error message";
        }
        
        Toast.makeText(this, 
                "Error: " + response.code() + " " + errorMessage, 
                Toast.LENGTH_LONG).show();
    }
}
```

### Step 5: Create a Simple Adapter

```java
public class UserAdapter extends RecyclerView.Adapter<UserAdapter.UserViewHolder> {
    private List<User> users = new ArrayList<>();
    
    public void setUsers(List<User> users) {
        this.users = users;
        notifyDataSetChanged();
    }
    
    @NonNull
    @Override
    public UserViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_user, parent, false);
        return new UserViewHolder(view);
    }
    
    @Override
    public void onBindViewHolder(@NonNull UserViewHolder holder, int position) {
        User user = users.get(position);
        holder.bind(user);
    }
    
    @Override
    public int getItemCount() {
        return users.size();
    }
    
    static class UserViewHolder extends RecyclerView.ViewHolder {
        private TextView nameTextView;
        private TextView emailTextView;
        
        public UserViewHolder(@NonNull View itemView) {
            super(itemView);
            nameTextView = itemView.findViewById(R.id.nameTextView);
            emailTextView = itemView.findViewById(R.id.emailTextView);
        }
        
        public void bind(User user) {
            nameTextView.setText(user.getName());
            emailTextView.setText(user.getEmail());
        }
    }
}
```

### Step 6: Create Layouts

Create `activity_main.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <androidx.recyclerview.widget.RecyclerView
        android:id="@+id/recyclerView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

    <ProgressBar
        android:id="@+id/progressBar"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_centerInParent="true"
        android:visibility="gone" />

</RelativeLayout>
```

Create `item_user.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.cardview.widget.CardView xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:layout_margin="8dp"
    app:cardCornerRadius="4dp"
    app:cardElevation="4dp">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:padding="16dp">

        <TextView
            android:id="@+id/nameTextView"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:textSize="18sp"
            android:textStyle="bold" />

        <TextView
            android:id="@+id/emailTextView"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="4dp"
            android:textSize="16sp" />

    </LinearLayout>

</androidx.cardview.widget.CardView>
```

## Approach 2: Using Retrofit with RxJava

RxJava provides better composability, thread management, and error handling for network operations.

### Step 1: Update the API Interface for RxJava

```java
public interface ApiService {
    @GET("users")
    Observable<List<User>> getUsersRx();
    
    @GET("users/{userId}")
    Observable<User> getUserRx(@Path("userId") int userId);
    
    @POST("users")
    Observable<User> createUserRx(@Body User user);
}
```

### Step 2: Update the Retrofit Client

```java
public class RetrofitClient {
    private static final String BASE_URL = "https://api.example.com/";
    private static RetrofitClient instance;
    private final Retrofit retrofit;
    
    private RetrofitClient() {
        OkHttpClient.Builder httpClient = new OkHttpClient.Builder();
        
        // Add logging interceptor for debugging
        HttpLoggingInterceptor loggingInterceptor = new HttpLoggingInterceptor();
        loggingInterceptor.setLevel(HttpLoggingInterceptor.Level.BODY);
        httpClient.addInterceptor(loggingInterceptor);
        
        retrofit = new Retrofit.Builder()
                .baseUrl(BASE_URL)
                .addConverterFactory(GsonConverterFactory.create())
                .addCallAdapterFactory(RxJava3CallAdapterFactory.create()) // Add RxJava adapter
                .client(httpClient.build())
                .build();
    }
    
    public static synchronized RetrofitClient getInstance() {
        if (instance == null) {
            instance = new RetrofitClient();
        }
        return instance;
    }
    
    public ApiService getApiService() {
        return retrofit.create(ApiService.class);
    }
}
```

### Step 3: Make API Calls with RxJava and Progress Indicator

```java
public class RxJavaActivity extends AppCompatActivity {
    private ProgressBar progressBar;
    private RecyclerView recyclerView;
    private UserAdapter adapter;
    private CompositeDisposable disposables = new CompositeDisposable();
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        progressBar = findViewById(R.id.progressBar);
        recyclerView = findViewById(R.id.recyclerView);
        
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        adapter = new UserAdapter();
        recyclerView.setAdapter(adapter);
        
        fetchUsers();
    }
    
    private void fetchUsers() {
        // Show progress bar
        progressBar.setVisibility(View.VISIBLE);
        
        ApiService apiService = RetrofitClient.getInstance().getApiService();
        
        disposables.add(
            apiService.getUsersRx()
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    users -> {
                        // Success response
                        progressBar.setVisibility(View.GONE);
                        adapter.setUsers(users);
                    },
                    throwable -> {
                        // Error response
                        progressBar.setVisibility(View.GONE);
                        Toast.makeText(RxJavaActivity.this, 
                                "Error: " + throwable.getMessage(), 
                                Toast.LENGTH_LONG).show();
                    }
                )
        );
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Clear all disposables to prevent memory leaks
        disposables.clear();
    }
}
```

## Approach 4: Using Volley

Volley is another popular networking library for Android, developed by Google.

### Step 1: Set up a Volley Request Queue

Create a singleton class to manage the Volley RequestQueue:

```java
public class VolleySingleton {
    private static VolleySingleton instance;
    private RequestQueue requestQueue;
    private static Context context;

    private VolleySingleton(Context context) {
        VolleySingleton.context = context;
        requestQueue = getRequestQueue();
    }

    public static synchronized VolleySingleton getInstance(Context context) {
        if (instance == null) {
            instance = new VolleySingleton(context);
        }
        return instance;
    }

    public RequestQueue getRequestQueue() {
        if (requestQueue == null) {
            // getApplicationContext() is key, it keeps you from leaking the
            // Activity or BroadcastReceiver if someone passes one in.
            requestQueue = Volley.newRequestQueue(context.getApplicationContext());
        }
        return requestQueue;
    }

    public <T> void addToRequestQueue(Request<T> req) {
        getRequestQueue().add(req);
    }
}
```

### Step 2: Make API Calls with Volley and Progress Indicator

```java
public class VolleyActivity extends AppCompatActivity {
    private ProgressBar progressBar;
    private RecyclerView recyclerView;
    private UserAdapter adapter;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        progressBar = findViewById(R.id.progressBar);
        recyclerView = findViewById(R.id.recyclerView);
        
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        adapter = new UserAdapter();
        recyclerView.setAdapter(adapter);
        
        fetchUsers();
    }
    
    private void fetchUsers() {
        // Show progress bar
        progressBar.setVisibility(View.VISIBLE);
        
        String url = "https://api.example.com/users";
        
        JsonArrayRequest request = new JsonArrayRequest(
                Request.Method.GET,
                url,
                null,
                response -> {
                    // Hide progress bar
                    progressBar.setVisibility(View.GONE);
                    
                    try {
                        List<User> users = new ArrayList<>();
                        Gson gson = new Gson();
                        
                        for (int i = 0; i < response.length(); i++) {
                            JSONObject userJson = response.getJSONObject(i);
                            User user = gson.fromJson(userJson.toString(), User.class);
                            users.add(user);
                        }
                        
                        adapter.setUsers(users);
                    } catch (JSONException e) {
                        Toast.makeText(VolleyActivity.this, 
                                "Error parsing response", 
                                Toast.LENGTH_LONG).show();
                    }
                },
                error -> {
                    // Hide progress bar
                    progressBar.setVisibility(View.GONE);
                    
                    // Handle error
                    String errorMessage = "Unknown error";
                    if (error.networkResponse != null) {
                        errorMessage = "Error code: " + error.networkResponse.statusCode;
                    } else if (error instanceof TimeoutError) {
                        errorMessage = "Connection timeout";
                    } else if (error instanceof NoConnectionError) {
                        errorMessage = "No internet connection";
                    }
                    
                    Toast.makeText(VolleyActivity.this, 
                            errorMessage, 
                            Toast.LENGTH_LONG).show();
                }
        );
        
        // Add the request to the RequestQueue
        VolleySingleton.getInstance(this).addToRequestQueue(request);
    }
}
```

## Different Types of Progress Indicators

Android provides several types of progress indicators for different use cases:

### 1. Circular Progress Bar

The standard `ProgressBar` displays a circular animation. It's useful for indicating that an operation is in progress without specifying how long it will take.

```xml
<ProgressBar
    android:id="@+id/progressBar"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:layout_centerInParent="true" />
```

### 2. Horizontal Progress Bar

For operations where you can track progress (like file downloads), a horizontal progress bar is more appropriate:

```xml
<ProgressBar
    android:id="@+id/progressBarHorizontal"
    style="?android:attr/progressBarStyleHorizontal"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:max="100" />
```

Update the progress in code:

```java
progressBarHorizontal.setProgress(progress);
```

### 3. SwipeRefreshLayout

For pull-to-refresh functionality:

```xml
<androidx.swiperefreshlayout.widget.SwipeRefreshLayout
    android:id="@+id/swipeRefreshLayout"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <androidx.recyclerview.widget.RecyclerView
        android:id="@+id/recyclerView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</androidx.swiperefreshlayout.widget.SwipeRefreshLayout>
```

In your activity:

```java
SwipeRefreshLayout swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout);
swipeRefreshLayout.setOnRefreshListener(() -> {
    fetchUsers();
});

// In your network callback:
swipeRefreshLayout.setRefreshing(false);
```

### 4. Content Loading Progress Bar

This is a specialized progress bar that handles delay showing/hiding to prevent flickering for quick operations:

```xml
<androidx.core.widget.ContentLoadingProgressBar
    android:id="@+id/contentLoadingProgressBar"
    style="?android:attr/progressBarStyle"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:layout_centerInParent="true" />
```

In your activity:

```java
ContentLoadingProgressBar contentLoadingProgressBar = findViewById(R.id.contentLoadingProgressBar);

// Show with a delay
contentLoadingProgressBar.show();

// Hide when done
contentLoadingProgressBar.hide();
```

### 5. Custom Shimmer Effect

For a more modern approach, you can use a shimmer effect to show loading states:

Add the shimmer library dependency:

```gradle
implementation 'com.facebook.shimmer:shimmer:0.5.0'
```

Create a shimmer layout:

```xml
<com.facebook.shimmer.ShimmerFrameLayout
    android:id="@+id/shimmerFrameLayout"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <!-- Layout to show during loading -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical">

        <!-- Repeat this item for a list effect -->
        <include layout="@layout/item_shimmer" />
        <include layout="@layout/item_shimmer" />
        <include layout="@layout/item_shimmer" />

    </LinearLayout>

</com.facebook.shimmer.ShimmerFrameLayout>
```

Create `item_shimmer.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.cardview.widget.CardView xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:layout_margin="8dp"
    app:cardCornerRadius="4dp"
    app:cardElevation="4dp">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:padding="16dp">

        <View
            android:layout_width="150dp"
            android:layout_height="18dp"
            android:background="@color/shimmer_color" />

        <View
            android:layout_width="200dp"
            android:layout_height="16dp"
            android:layout_marginTop="8dp"
            android:background="@color/shimmer_color" />

    </LinearLayout>

</androidx.cardview.widget.CardView>
```

Control the shimmer effect in code:

```java
ShimmerFrameLayout shimmerFrameLayout = findViewById(R.id.shimmerFrameLayout);
RecyclerView recyclerView = findViewById(R.id.recyclerView);

// Show shimmer, hide content
shimmerFrameLayout.setVisibility(View.VISIBLE);
shimmerFrameLayout.startShimmer();
recyclerView.setVisibility(View.GONE);

// When data is loaded:
shimmerFrameLayout.stopShimmer();
shimmerFrameLayout.setVisibility(View.GONE);
recyclerView.setVisibility(View.VISIBLE);
```

## Implementing a Loading State Pattern

For a more structured approach, you can implement a loading state pattern using an enum:

```java
public enum LoadingState {
    LOADING,
    SUCCESS,
    ERROR
}
```

Then update your UI based on the current state:

```java
private void updateUI(LoadingState state, List<User> data, String errorMessage) {
    switch (state) {
        case LOADING:
            progressBar.setVisibility(View.VISIBLE);
            recyclerView.setVisibility(View.GONE);
            errorView.setVisibility(View.GONE);
            break;
            
        case SUCCESS:
            progressBar.setVisibility(View.GONE);
            recyclerView.setVisibility(View.VISIBLE);
            errorView.setVisibility(View.GONE);
            adapter.setUsers(data);
            break;
            
        case ERROR:
            progressBar.setVisibility(View.GONE);
            recyclerView.setVisibility(View.GONE);
            errorView.setVisibility(View.VISIBLE);
            errorTextView.setText(errorMessage);
            break;
    }
}
```

## Handling Configuration Changes

To handle configuration changes (like screen rotation) properly:

### 1. Use ViewModel with LiveData

```java
public class UserViewModel extends ViewModel {
    private MutableLiveData<List<User>> users = new MutableLiveData<>();
    private MutableLiveData<Boolean> isLoading = new MutableLiveData<>(false);
    private MutableLiveData<String> error = new MutableLiveData<>();
    
    private CompositeDisposable disposables = new CompositeDisposable();
    
    public LiveData<List<User>> getUsers() {
        return users;
    }
    
    public LiveData<Boolean> getIsLoading() {
        return isLoading;
    }
    
    public LiveData<String> getError() {
        return error;
    }
    
    public void fetchUsers() {
        isLoading.setValue(true);
        
        ApiService apiService = RetrofitClient.getInstance().getApiService();
        
        disposables.add(
            apiService.getUsersRx()
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    result -> {
                        isLoading.setValue(false);
                        users.setValue(result);
                    },
                    throwable -> {
                        isLoading.setValue(false);
                        error.setValue(throwable.getMessage());
                    }
                )
        );
    }
    
    @Override
    protected void onCleared() {
        super.onCleared();
        disposables.clear();
    }
}
```

In your activity:

```java
public class UserActivity extends AppCompatActivity {
    private ProgressBar progressBar;
    private RecyclerView recyclerView;
    private TextView errorTextView;
    private UserAdapter adapter;
    private UserViewModel viewModel;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_user);
        
        progressBar = findViewById(R.id.progressBar);
        recyclerView = findViewById(R.id.recyclerView);
        errorTextView = findViewById(R.id.errorTextView);
        
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        adapter = new UserAdapter();
        recyclerView.setAdapter(adapter);
        
        viewModel = new ViewModelProvider(this).get(UserViewModel.class);
        
        // Observe loading state
        viewModel.getIsLoading().observe(this, isLoading -> {
            progressBar.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        });
        
        // Observe users data
        viewModel.getUsers().observe(this, users -> {
            adapter.setUsers(users);
            recyclerView.setVisibility(View.VISIBLE);
            errorTextView.setVisibility(View.GONE);
        });
        
        // Observe error state
        viewModel.getError().observe(this, errorMessage -> {
            errorTextView.setText(errorMessage);
            errorTextView.setVisibility(View.VISIBLE);
            recyclerView.setVisibility(View.GONE);
        });
        
        // Fetch data
        viewModel.fetchUsers();
    }
}
```

## Caching Strategies

Implement caching to improve performance and reduce network requests:

### 1. OkHttp Caching

```java
private RetrofitClient() {
    File cacheDir = new File(context.getCacheDir(), "http-cache");
    Cache cache = new Cache(cacheDir, 10 * 1024 * 1024); // 10 MB cache
    
    OkHttpClient.Builder httpClient = new OkHttpClient.Builder()
            .cache(cache)
            .addInterceptor(new Interceptor() {
                @Override
                public Response intercept(Chain chain) throws IOException {
                    Request originalRequest = chain.request();
                    
                    // Add cache control headers based on network availability
                    String cacheControl;
                    if (isNetworkAvailable()) {
                        cacheControl = "public, max-age=60"; // Cache for 1 minute
                    } else {
                        cacheControl = "public, only-if-cached, max-stale=3600";
                    }
                    
                    Request request = originalRequest.newBuilder()
                            .header("Cache-Control", cacheControl)
                            .build();
                    
                    return chain.proceed(request);
                }
            });
    
    // Rest of the RetrofitClient setup
}
```

### 2. Room Database for Offline Caching

For more robust offline support, use Room to store API responses.

Define an entity:

```java
@Entity(tableName = "users")
public class UserEntity {
    @PrimaryKey
    private int id;
    private String name;
    private String email;
    
    // Getters and setters
}
```

Create a DAO:

```java
@Dao
public interface UserDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertUsers(List<UserEntity> users);
    
    @Query("SELECT * FROM users")
    List<UserEntity> getAllUsers();
    
    @Query("DELETE FROM users")
    void deleteAllUsers();
}
```

Create the database:

```java
@Database(entities = {UserEntity.class}, version = 1)
public abstract class AppDatabase extends RoomDatabase {
    private static AppDatabase instance;
    
    public abstract UserDao userDao();
    
    public static synchronized AppDatabase getInstance(Context context) {
        if (instance == null) {
            instance = Room.databaseBuilder(
                    context.getApplicationContext(),
                    AppDatabase.class,
                    "app_database")
                    .build();
        }
        return instance;
    }
}
```

Create a repository to handle data from both network and local storage:

```java
public class UserRepository {
    private ApiService apiService;
    private UserDao userDao;
    private Context context;
    
    public UserRepository(Context context) {
        this.context = context;
        apiService = RetrofitClient.getInstance().getApiService();
        userDao = AppDatabase.getInstance(context).userDao();
    }
    
    public Observable<List<User>> getUsers() {
        return Observable.concatArrayEager(
                getUsersFromDb(),
                getUsersFromApi());
    }
    
    private Observable<List<User>> getUsersFromDb() {
        return Observable.fromCallable(() -> {
            List<UserEntity> userEntities = userDao.getAllUsers();
            List<User> users = new ArrayList<>();
            
            for (UserEntity entity : userEntities) {
                User user = new User();
                user.setId(entity.getId());
                user.setName(entity.getName());
                user.setEmail(entity.getEmail());
                users.add(user);
            }
            
            return users;
        }).subscribeOn(Schedulers.io());
    }
    
    private Observable<List<User>> getUsersFromApi() {
        return apiService.getUsersRx()
                .doOnNext(users -> {
                    storeUsersInDb(users);
                })
                .subscribeOn(Schedulers.io());
    }
    
    private void storeUsersInDb(List<User> users) {
        List<UserEntity> userEntities = new ArrayList<>();
        
        for (User user : users) {
            UserEntity entity = new UserEntity();
            entity.setId(user.getId());
            entity.setName(user.getName());
            entity.setEmail(user.getEmail());
            userEntities.add(entity);
        }
        
        userDao.deleteAllUsers();
        userDao.insertUsers(userEntities);
    }
}